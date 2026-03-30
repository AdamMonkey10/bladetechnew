import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, AlertTriangle } from "lucide-react";
import { TimesheetDataTable } from "@/components/timesheet-management/TimesheetDataTable";
import { TimesheetFilters } from "@/components/timesheet-management/TimesheetFilters";


import { useTimesheetTracking } from "@/hooks/useTimesheetTracking";

export default function TimesheetManagement() {
  const { operatorStats, loading } = useTimesheetTracking();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<{
    dateFrom?: Date;
    dateTo?: Date;
    operatorFilter: string;
    statusFilter: string;
    escalationFilter: string;
  }>({
    operatorFilter: "",
    statusFilter: "all",
    escalationFilter: "all"
  });

  const totalOverdue = operatorStats.reduce((sum, stat) => sum + stat.total_overdue, 0);
  const criticalCount = operatorStats.reduce((sum, stat) => sum + stat.critical_count, 0);
  const totalOperators = operatorStats.length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading timesheet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Management</h1>
          <p className="text-muted-foreground">
            Comprehensive timesheet oversight and data quality management
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOperators}</div>
            <p className="text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Timesheets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">6+ days overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalOperators > 0 ? Math.round(((totalOperators - operatorStats.filter(s => s.total_overdue > 0).length) / totalOperators) * 100) : 100}%
            </div>
            <p className="text-xs text-muted-foreground">On-time submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">
            Manage
            {totalOverdue > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalOverdue}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Overview</CardTitle>
              <CardDescription>
                Current status of all operator timesheets and submission compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimesheetDataTable mode="overview" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <TimesheetFilters onFiltersChange={(filters) => {
            // Store filters to pass to TimesheetDataTable
            setFilters(filters);
          }} />
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Management</CardTitle>
              <CardDescription>
                Search, filter, and edit timesheet entries with bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimesheetDataTable mode="manage" filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}