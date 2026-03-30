import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLES_TO_BACKUP = [
  "shift_records",
  "operators",
  "machines",
  "products",
  "raw_materials",
  "customers",
  "customer_pos",
  "goods_received",
  "printed_labels",
  "pallets",
  "calibration_records",
  "registered_devices",
  "oee_daily_summary",
  "equipment",
  "stock_items",
  "clockfy_employees",
  "clockfy_time_events",
  "timesheet_tracking",
  "product_specifications",
  "raw_material_specifications",
  "product_materials",
  "printer_settings",
  "box_number_sequences",
  "pallet_number_sequences",
  "pallet_assignments",
  "label_printing_sessions",
  "milwaukee_test_reports",
  "goods_out",
  "report_recipients",
  "report_groups",
  "recipient_group_members",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "backup";

    if (action === "cleanup") {
      return await handleCleanup(supabase);
    }

    // Main backup logic
    const today = new Date().toISOString().split("T")[0];
    const backupData: Record<string, unknown[]> = {};
    const tablesIncluded: string[] = [];

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from("backup_logs")
      .insert({
        backup_date: today,
        status: "in_progress",
        action_type: "backup",
        tables_included: [],
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create log entry:", logError);
    }

    // Export each table
    for (const table of TABLES_TO_BACKUP) {
      try {
        let allRows: unknown[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .range(from, from + pageSize - 1);

          if (error) {
            console.error(`Error exporting ${table}:`, error.message);
            break;
          }

          if (data && data.length > 0) {
            allRows = allRows.concat(data);
            from += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        backupData[table] = allRows;
        tablesIncluded.push(table);
        console.log(`Exported ${table}: ${allRows.length} rows`);
      } catch (e) {
        console.error(`Failed to export ${table}:`, e);
      }
    }

    const jsonContent = JSON.stringify(backupData, null, 2);
    const fileSizeBytes = new TextEncoder().encode(jsonContent).length;
    const storagePath = `${today}/full-backup.json`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(storagePath, jsonContent, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
    }

    // Push to GitHub
    let githubUrl = null;
    const githubToken = Deno.env.get("GITHUB_BACKUP_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_BACKUP_REPO");
    const projectName = Deno.env.get("GITHUB_BACKUP_PROJECT_NAME") || "default";

    if (githubToken && githubRepo) {
      try {
        githubUrl = await pushToGitHub(
          githubToken,
          githubRepo,
          `backups/${projectName}/${today}/full-backup.json`,
          jsonContent
        );
        console.log("Pushed to GitHub:", githubUrl);
      } catch (e) {
        console.error("GitHub push failed:", e);
      }
    } else {
      console.log("GitHub backup skipped: GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO not set");
    }

    // Update log entry
    if (logEntry) {
      await supabase
        .from("backup_logs")
        .update({
          file_path: storagePath,
          github_url: githubUrl,
          file_size_bytes: fileSizeBytes,
          tables_included: tablesIncluded,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        tables: tablesIncluded.length,
        totalRows: Object.values(backupData).reduce((s, r) => s + r.length, 0),
        fileSizeBytes,
        githubUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Backup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function pushToGitHub(
  token: string,
  repo: string,
  path: string,
  content: string
): Promise<string> {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // Check if file exists to get its SHA (needed for updates)
  let sha: string | undefined;
  const getResp = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (getResp.ok) {
    const existing = await getResp.json();
    sha = existing.sha;
  } else {
    await getResp.text(); // consume body
  }

  // Create or update file
  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Automated backup ${new Date().toISOString().split("T")[0]}`,
      content: btoa(unescape(encodeURIComponent(content))),
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putResp.ok) {
    const errText = await putResp.text();
    throw new Error(`GitHub API error ${putResp.status}: ${errText}`);
  }

  const result = await putResp.json();
  return result.content?.html_url || `https://github.com/${repo}/blob/main/${path}`;
}

async function handleCleanup(supabase: ReturnType<typeof createClient>) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // List all backup folders
  const { data: folders, error } = await supabase.storage
    .from("backups")
    .list("", { limit: 1000 });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let removedCount = 0;
  for (const folder of folders || []) {
    const folderDate = new Date(folder.name);
    if (!isNaN(folderDate.getTime()) && folderDate < thirtyDaysAgo) {
      const { data: files } = await supabase.storage
        .from("backups")
        .list(folder.name);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${folder.name}/${f.name}`);
        await supabase.storage.from("backups").remove(paths);
        removedCount += paths.length;
      }
    }
  }

  // Log cleanup
  await supabase.from("backup_logs").insert({
    backup_date: new Date().toISOString().split("T")[0],
    status: "completed",
    action_type: "cleanup",
    tables_included: [],
    completed_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ success: true, removedFiles: removedCount }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
