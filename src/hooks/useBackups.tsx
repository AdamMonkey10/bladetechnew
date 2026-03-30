import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BackupLog {
  id: string;
  backup_date: string;
  file_path: string | null;
  github_url: string | null;
  file_size_bytes: number | null;
  tables_included: string[] | null;
  status: string;
  action_type: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backup logs
  const logsQuery = useQuery({
    queryKey: ["backup-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as BackupLog[];
    },
  });

  // Run backup now
  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("database-backup", {
        body: { action: "backup" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Backup completed", description: "Database backup finished successfully." });
      queryClient.invalidateQueries({ queryKey: ["backup-logs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Backup failed", description: error.message, variant: "destructive" });
    },
  });

  // Browse snapshot
  const browseSnapshot = async (backupDate: string, tableName?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke("backup-restore", {
      body: { action: "browse", backup_date: backupDate, table_name: tableName },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (error) throw error;
    return data;
  };

  // Restore
  const restoreMutation = useMutation({
    mutationFn: async ({
      backupDate,
      tableName,
      recordIds,
    }: {
      backupDate: string;
      tableName: string;
      recordIds?: string[];
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke("backup-restore", {
        body: {
          backup_date: backupDate,
          table_name: tableName,
          record_ids: recordIds,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Restore completed",
        description: `Restored ${data.restoredCount} records to ${data.table} from ${data.fromDate}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["backup-logs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    logs: logsQuery.data || [],
    isLoadingLogs: logsQuery.isLoading,
    runBackup: runBackupMutation.mutate,
    isRunningBackup: runBackupMutation.isPending,
    browseSnapshot,
    restore: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
}
