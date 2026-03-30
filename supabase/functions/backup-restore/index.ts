import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { backup_date, table_name, record_ids, action } = body;

    if (!backup_date) {
      return new Response(
        JSON.stringify({ error: "backup_date is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: browse - just return the snapshot data
    if (action === "browse") {
      const snapshot = await getSnapshot(supabase, backup_date);
      if (!snapshot) {
        return new Response(
          JSON.stringify({ error: "No backup found for this date" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (table_name) {
        return new Response(
          JSON.stringify({
            table: table_name,
            rows: snapshot[table_name] || [],
            tables: Object.keys(snapshot),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return table summary
      const summary: Record<string, number> = {};
      for (const [key, val] of Object.entries(snapshot)) {
        summary[key] = Array.isArray(val) ? val.length : 0;
      }
      return new Response(
        JSON.stringify({ tables: summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: restore
    if (!table_name) {
      return new Response(
        JSON.stringify({ error: "table_name is required for restore" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const snapshot = await getSnapshot(supabase, backup_date);
    if (!snapshot || !snapshot[table_name]) {
      return new Response(
        JSON.stringify({ error: `No backup data found for table ${table_name} on ${backup_date}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const backupRows = snapshot[table_name] as Record<string, unknown>[];

    // Log restore action
    const { data: logEntry } = await supabase
      .from("backup_logs")
      .insert({
        backup_date,
        status: "in_progress",
        action_type: "restore",
        tables_included: [table_name],
      })
      .select()
      .single();

    let restoredCount = 0;

    try {
      if (record_ids && Array.isArray(record_ids) && record_ids.length > 0) {
        // Restore specific records by upsert
        const rowsToRestore = backupRows.filter(
          (r) => record_ids.includes((r as Record<string, unknown>).id)
        );

        for (const row of rowsToRestore) {
          const { error } = await supabase
            .from(table_name)
            .upsert(row as Record<string, unknown>, { onConflict: "id" });

          if (error) {
            console.error(`Failed to upsert record in ${table_name}:`, error);
          } else {
            restoredCount++;
          }
        }
      } else {
        // Full table restore: delete all then insert
        // Take pre-restore snapshot first
        const { data: currentData } = await supabase
          .from(table_name)
          .select("*")
          .limit(10000);

        const preSnapshotJson = JSON.stringify({ [table_name]: currentData || [] });
        const preSnapshotPath = `pre-restore/${new Date().toISOString()}/${table_name}.json`;

        await supabase.storage
          .from("backups")
          .upload(preSnapshotPath, preSnapshotJson, {
            contentType: "application/json",
            upsert: true,
          });

        // Delete existing rows
        const { error: deleteError } = await supabase
          .from(table_name)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

        if (deleteError) {
          throw new Error(`Failed to clear table ${table_name}: ${deleteError.message}`);
        }

        // Insert backup rows in batches
        const batchSize = 500;
        for (let i = 0; i < backupRows.length; i += batchSize) {
          const batch = backupRows.slice(i, i + batchSize);
          const { error } = await supabase.from(table_name).insert(batch);
          if (error) {
            console.error(`Batch insert error for ${table_name}:`, error);
          } else {
            restoredCount += batch.length;
          }
        }
      }

      // Update log
      if (logEntry) {
        await supabase
          .from("backup_logs")
          .update({
            status: "completed",
            file_path: `restore from ${backup_date}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logEntry.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          table: table_name,
          restoredCount,
          fromDate: backup_date,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (restoreError) {
      if (logEntry) {
        await supabase
          .from("backup_logs")
          .update({
            status: "failed",
            error_message: restoreError.message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logEntry.id);
      }
      throw restoreError;
    }
  } catch (error) {
    console.error("Restore error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getSnapshot(
  supabase: ReturnType<typeof createClient>,
  backupDate: string
): Promise<Record<string, unknown[]> | null> {
  const storagePath = `${backupDate}/full-backup.json`;

  // Try storage first
  const { data, error } = await supabase.storage
    .from("backups")
    .download(storagePath);

  if (!error && data) {
    const text = await data.text();
    return JSON.parse(text);
  }

  // Fall back to GitHub for older backups
  const githubToken = Deno.env.get("GITHUB_BACKUP_TOKEN");
  const githubRepo = Deno.env.get("GITHUB_BACKUP_REPO");

  if (githubToken && githubRepo) {
    try {
      const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/backups/${backupDate}/full-backup.json`;
      const resp = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3.raw",
        },
      });

      if (resp.ok) {
        const text = await resp.text();
        return JSON.parse(text);
      }
      await resp.text(); // consume
    } catch (e) {
      console.error("GitHub fetch failed:", e);
    }
  }

  return null;
}
