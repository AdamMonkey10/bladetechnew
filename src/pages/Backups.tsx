import { useState } from "react";
import { useBackups, BackupLog } from "@/hooks/useBackups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Download, ExternalLink, Play, RotateCcw, Clock, HardDrive, CalendarDays, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Backups() {
  const { logs, isLoadingLogs, runBackup, isRunningBackup, browseSnapshot, restore, isRestoring } = useBackups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backups & Time Machine</h1>
          <p className="text-muted-foreground">Manage database backups and restore historical data</p>
        </div>
        <Button onClick={() => runBackup()} disabled={isRunningBackup}>
          {isRunningBackup ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Run Backup Now
        </Button>
      </div>

      <SummaryCards logs={logs} />

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="time-machine">Time Machine</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <HistoryTab logs={logs} isLoading={isLoadingLogs} />
        </TabsContent>
        <TabsContent value="time-machine">
          <TimeMachineTab logs={logs} browseSnapshot={browseSnapshot} restore={restore} isRestoring={isRestoring} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCards({ logs }: { logs: BackupLog[] }) {
  const lastBackup = logs.find((l) => l.action_type === "backup" && l.status === "completed");
  const totalBackups = logs.filter((l) => l.action_type === "backup" && l.status === "completed").length;
  const totalSize = logs
    .filter((l) => l.action_type === "backup" && l.file_size_bytes)
    .reduce((s, l) => s + (l.file_size_bytes || 0), 0);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {lastBackup ? format(new Date(lastBackup.created_at), "dd MMM yyyy HH:mm") : "None yet"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{totalBackups}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{formatBytes(totalSize)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab({ logs, isLoading }: { logs: BackupLog[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup History</CardTitle>
        <CardDescription>All backup and restore operations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No backups yet. Click "Run Backup Now" to create your first backup.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <Badge variant={log.action_type === "backup" ? "default" : log.action_type === "restore" ? "secondary" : "outline"}>
                      {log.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === "completed" ? "default" : log.status === "failed" ? "destructive" : "outline"}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.tables_included?.length || 0}</TableCell>
                  <TableCell>{log.file_size_bytes ? formatBytes(log.file_size_bytes) : "-"}</TableCell>
                  <TableCell className="flex gap-1">
                    {log.github_url && (
                      <a href={log.github_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface TimeMachineTabProps {
  logs: BackupLog[];
  browseSnapshot: (date: string, table?: string) => Promise<unknown>;
  restore: (params: { backupDate: string; tableName: string; recordIds?: string[] }) => void;
  isRestoring: boolean;
}

function TimeMachineTab({ logs, browseSnapshot, restore, isRestoring }: TimeMachineTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tableSummary, setTableSummary] = useState<Record<string, number> | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const availableDates = [...new Set(
    logs
      .filter((l) => l.action_type === "backup" && l.status === "completed")
      .map((l) => l.backup_date)
  )];

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedTable("");
    setTableData([]);
    setSelectedRecords(new Set());
    setIsLoading(true);
    try {
      const result = await browseSnapshot(date) as { tables: Record<string, number> };
      setTableSummary(result.tables || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = async (table: string) => {
    setSelectedTable(table);
    setSelectedRecords(new Set());
    setPage(0);
    setIsLoading(true);
    try {
      const result = await browseSnapshot(selectedDate, table) as { rows: Record<string, unknown>[] };
      setTableData(result.rows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const paginatedData = tableData.slice(page * pageSize, (page + 1) * pageSize);
  const columns = paginatedData.length > 0 ? Object.keys(paginatedData[0]).slice(0, 8) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Time Machine
          </CardTitle>
          <CardDescription>Browse and restore data from any backup point</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selector */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Backup Date</label>
              <Select value={selectedDate} onValueChange={handleDateSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.length === 0 ? (
                    <SelectItem value="none" disabled>No backups available</SelectItem>
                  ) : (
                    availableDates.map((d) => (
                      <SelectItem key={d} value={d}>
                        {format(new Date(d), "dd MMM yyyy")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {tableSummary && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Table</label>
                <Select value={selectedTable} onValueChange={handleTableSelect}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tableSummary).map(([name, count]) => (
                      <SelectItem key={name} value={name}>
                        {name} ({count} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {/* Table Data Viewer */}
          {!isLoading && selectedTable && tableData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {tableData.length} total rows • Showing columns: {columns.join(", ")}
                  {Object.keys(tableData[0]).length > 8 && ` (+${Object.keys(tableData[0]).length - 8} more)`}
                </p>
                <div className="flex gap-2">
                  {selectedRecords.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isRestoring}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore {selectedRecords.size} Records
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore Selected Records?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will upsert {selectedRecords.size} record(s) into <strong>{selectedTable}</strong> from the backup dated {selectedDate}. Existing records with the same ID will be overwritten.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => restore({
                              backupDate: selectedDate,
                              tableName: selectedTable,
                              recordIds: [...selectedRecords],
                            })}
                          >
                            Confirm Restore
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isRestoring}>
                        {isRestoring ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Database className="h-3 w-3 mr-1" />}
                        Restore Entire Table
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore Entire Table?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will <strong>replace all data</strong> in <strong>{selectedTable}</strong> with {tableData.length} rows from the backup dated {selectedDate}. A pre-restore snapshot will be saved automatically. This action cannot be easily undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => restore({ backupDate: selectedDate, tableName: selectedTable })}
                        >
                          Yes, Restore Entire Table
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={paginatedData.every((r) => selectedRecords.has(r.id as string))}
                          onCheckedChange={(checked) => {
                            setSelectedRecords((prev) => {
                              const next = new Set(prev);
                              paginatedData.forEach((r) => {
                                if (checked) next.add(r.id as string);
                                else next.delete(r.id as string);
                              });
                              return next;
                            });
                          }}
                        />
                      </TableHead>
                      {columns.map((col) => (
                        <TableHead key={col} className="text-xs">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.has(row.id as string)}
                            onCheckedChange={() => toggleRecord(row.id as string)}
                          />
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col} className="text-xs max-w-[200px] truncate">
                            {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {tableData.length > pageSize && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {Math.ceil(tableData.length / pageSize)}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= tableData.length} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && selectedTable && tableData.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No data found in this table for the selected backup.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
