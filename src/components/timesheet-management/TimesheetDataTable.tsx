import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle 
} from "lucide-react";
import { format } from "date-fns";
import { useTimesheetTracking } from "@/hooks/useTimesheetTracking";
import { TimesheetEditDialog } from "./TimesheetEditDialog";

interface TimesheetDataTableProps {
  mode: "overview" | "manage";
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    operatorFilter: string;
    statusFilter: string;
    escalationFilter: string;
  };
}

export function TimesheetDataTable({ mode, filters }: TimesheetDataTableProps) {
  const { overdueRecords, allRecords, operatorStats, loading, refetch } = useTimesheetTracking();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (mode === "overview") {
      let data = operatorStats.filter(stat =>
        stat.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stat.operator_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Apply advanced filters if provided
      if (filters) {
        data = data.filter(item => {
          // Operator filter
          if (filters.operatorFilter) {
            if (!item.operator_name.toLowerCase().includes(filters.operatorFilter.toLowerCase()) &&
                !item.operator_code.toLowerCase().includes(filters.operatorFilter.toLowerCase())) {
              return false;
            }
          }
          
          // Escalation filter
          if (filters.escalationFilter !== "all") {
            if (item.highest_escalation !== filters.escalationFilter) return false;
          }
          
          return true;
        });
      }
      
      return data;
    } else {
      let data = allRecords.filter(record =>
        record.operators?.operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.operators?.operator_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false
      );
      
      // Apply advanced filters if provided
      if (filters) {
        data = data.filter(item => {
          // Date filtering
          if (filters.dateFrom || filters.dateTo) {
            const workDate = new Date(item.work_date);
            if (filters.dateFrom && workDate < filters.dateFrom) return false;
            if (filters.dateTo && workDate > filters.dateTo) return false;
          }
          
          // Operator filter
          if (filters.operatorFilter) {
            const name = item.operators?.operator_name || "";
            const code = item.operators?.operator_code || "";
            if (!name.toLowerCase().includes(filters.operatorFilter.toLowerCase()) &&
                !code.toLowerCase().includes(filters.operatorFilter.toLowerCase())) {
              return false;
            }
          }
          
          // Status filter
          if (filters.statusFilter !== "all") {
            const isSubmitted = item.timesheet_submitted;
            const isOverdue = item.days_overdue > 0;
            
            if (filters.statusFilter === "submitted" && !isSubmitted) return false;
            if (filters.statusFilter === "missing" && isSubmitted) return false;
            if (filters.statusFilter === "overdue" && !isOverdue) return false;
          }
          
          // Escalation filter
          if (filters.escalationFilter !== "all") {
            if (item.escalation_level !== filters.escalationFilter) return false;
          }
          
          return true;
        });
      }
      
      return data;
    }
  }, [mode, operatorStats, allRecords, searchTerm, filters]);

  const getEscalationBadge = (level: string) => {
    const variants = {
      none: "default",
      warning: "secondary",
      urgent: "destructive",
      critical: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || "default"}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = mode === "overview" 
        ? (filteredData as any[]).map(stat => stat.operator_id)
        : (filteredData as any[]).map(record => record.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode === "manage" && (
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              <Button variant="outline" size="sm">
                Bulk Actions
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {mode === "manage" && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === filteredData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Operator</TableHead>
              <TableHead>Code</TableHead>
              {mode === "overview" ? (
                <>
                  <TableHead>Total Overdue</TableHead>
                  <TableHead>Highest Escalation</TableHead>
                  <TableHead>Oldest Overdue</TableHead>
                </>
               ) : (
                 <>
                   <TableHead>Work Date</TableHead>
                   <TableHead>Submitted</TableHead>
                   <TableHead>Hours Booked</TableHead>
                 </>
               )}
               <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={mode === "manage" ? 7 : 6} 
                  className="text-center py-8 text-muted-foreground"
                >
                  {mode === "overview" ? "All operators are up to date" : "No timesheet records found"}
                </TableCell>
              </TableRow>
            ) : (
               filteredData.map((item) => (
                 <TableRow key={mode === "overview" ? (item as any).operator_id : (item as any).id}>
                  {mode === "manage" && (
                    <TableCell>
                       <Checkbox
                         checked={selectedRows.includes((item as any).id)}
                         onCheckedChange={(checked) => 
                           handleSelectRow((item as any).id, checked as boolean)
                         }
                       />
                    </TableCell>
                  )}
                   <TableCell className="font-medium">
                     {mode === "overview" 
                       ? (item as any).operator_name 
                       : (item as any).operators?.operator_name || "Unknown"}
                   </TableCell>
                   <TableCell>
                     {mode === "overview" 
                       ? (item as any).operator_code 
                       : (item as any).operators?.operator_code || "Unknown"}
                   </TableCell>
                  {mode === "overview" ? (
                    <>
                       <TableCell>
                         {(item as any).total_overdue > 0 ? (
                           <Badge variant="destructive">{(item as any).total_overdue}</Badge>
                         ) : (
                           <Badge variant="default">0</Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         {getEscalationBadge((item as any).highest_escalation)}
                       </TableCell>
                       <TableCell>
                         {(item as any).oldest_overdue_date ? (
                           <div className="flex items-center gap-1 text-sm">
                             <Calendar className="h-3 w-3" />
                             {format(new Date((item as any).oldest_overdue_date), "MMM dd, yyyy")}
                           </div>
                         ) : (
                           <span className="text-muted-foreground">-</span>
                         )}
                       </TableCell>
                    </>
                  ) : (
                    <>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {format(new Date((item as any).work_date), "MMM dd, yyyy")}
                         </div>
                        </TableCell>
                        <TableCell>
                          {(item as any).timesheet_submitted ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Yes
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <Clock className="h-3 w-3" />
                              No ({(item as any).days_overdue} days overdue)
                            </div>
                          )}
                       </TableCell>
                          <TableCell>
                            {(() => {
                              const shiftData = (item as any).shift_records?.[0]?.production_data;
                             
                              // First, check if hours_booked exists at the top level
                              const hoursBooked = parseFloat(shiftData?.hours_booked);
                              if (!isNaN(hoursBooked) && hoursBooked > 0) {
                                return (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {hoursBooked.toFixed(1)}h
                                  </div>
                                );
                              }
                             
                             // Fall back to calculating from activities
                             if (shiftData?.activities) {
                               let totalHours = 0;
                               
                               if (Array.isArray(shiftData.activities)) {
                                 // New format: activities is array with name and entries
                                 shiftData.activities.forEach((activity: any) => {
                                   if (activity.entries && Array.isArray(activity.entries)) {
                                     activity.entries.forEach((entry: any) => {
                                       const timeSpent = parseFloat(entry.time_spent) || 0;
                                       totalHours += timeSpent;
                                     });
                                   }
                                 });
                               } else {
                                 // Legacy format: activities is object with activity types as keys
                                 Object.values(shiftData.activities).forEach((entries: any) => {
                                   if (Array.isArray(entries)) {
                                     entries.forEach((entry: any) => {
                                       const timeSpent = parseFloat(entry.TimeSpent || entry.time_spent) || 0;
                                       totalHours += timeSpent;
                                     });
                                   }
                                 });
                               }
                               
                               if (totalHours > 0) {
                                 return (
                                   <div className="flex items-center gap-1">
                                     <Clock className="h-3 w-3" />
                                     {totalHours.toFixed(1)}h
                                   </div>
                                 );
                               }
                             }
                             
                             return <span className="text-muted-foreground">-</span>;
                           })()}
                          </TableCell>
                    </>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRecord(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingRecord && (
        <TimesheetEditDialog
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={async () => {
            console.log("onSave called, starting refetch...");
            setEditingRecord(null);
            try {
              await refetch();
              console.log("Refetch completed");
            } catch (error) {
              console.error("Refetch failed:", error);
            }
          }}
        />
      )}
    </div>
  );
}