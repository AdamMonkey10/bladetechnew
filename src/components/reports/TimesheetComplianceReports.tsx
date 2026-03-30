import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  BarChart3,
  Download
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { useTimesheetTracking } from "@/hooks/useTimesheetTracking";
import { TimesheetDataTable } from "@/components/timesheet-management/TimesheetDataTable";
import { TimesheetFilters } from "@/components/timesheet-management/TimesheetFilters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export function TimesheetComplianceReports() {
  const { overdueRecords, allRecords, operatorStats, loading } = useTimesheetTracking();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filters, setFilters] = useState({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    operatorFilter: "",
    statusFilter: "all",
    escalationFilter: "all",
  });

  const handleFiltersChange = (newFilters: {
    dateFrom?: Date;
    dateTo?: Date;
    operatorFilter: string;
    statusFilter: string;
    escalationFilter: string;
  }) => {
    setFilters({
      dateFrom: newFilters.dateFrom || filters.dateFrom,
      dateTo: newFilters.dateTo || filters.dateTo,
      operatorFilter: newFilters.operatorFilter,
      statusFilter: newFilters.statusFilter,
      escalationFilter: newFilters.escalationFilter,
    });
  };

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const totalOperators = operatorStats.length;
    const operatorsWithOverdue = operatorStats.filter(op => op.total_overdue > 0).length;
    const totalOverdueItems = operatorStats.reduce((sum, op) => sum + op.total_overdue, 0);
    const criticalItems = operatorStats.reduce((sum, op) => sum + op.critical_count, 0);
    
    const complianceRate = totalOperators > 0 
      ? ((totalOperators - operatorsWithOverdue) / totalOperators * 100).toFixed(1)
      : "0";

    // Calculate average overdue days
    const avgOverdueDays = overdueRecords.length > 0 
      ? (overdueRecords.reduce((sum, record) => sum + record.days_overdue, 0) / overdueRecords.length).toFixed(1)
      : "0";

    return {
      totalOperators,
      operatorsWithOverdue,
      totalOverdueItems,
      criticalItems,
      complianceRate,
      avgOverdueDays,
      onTimeSubmissions: totalOperators - operatorsWithOverdue
    };
  }, [operatorStats, overdueRecords]);

  // Generate historical compliance data
  const complianceHistoryData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter records for this date
      const recordsForDate = allRecords.filter(record => 
        record.work_date === dateStr
      );
      
      const totalForDate = recordsForDate.length;
      const submittedForDate = recordsForDate.filter(r => r.timesheet_submitted).length;
      const complianceForDate = totalForDate > 0 
        ? (submittedForDate / totalForDate * 100)
        : 100;

      days.push({
        date: format(date, 'MMM dd'),
        compliance: complianceForDate,
        total: totalForDate,
        submitted: submittedForDate,
        overdue: totalForDate - submittedForDate
      });
    }
    return days;
  }, [allRecords]);

  // Escalation level distribution
  const escalationData = useMemo(() => {
    const data = [
      { name: 'Late', value: operatorStats.reduce((sum, op) => sum + op.late_count, 0), color: '#f59e0b' },
      { name: 'Critical', value: operatorStats.reduce((sum, op) => sum + op.critical_count, 0), color: '#dc2626' }
    ];
    return data.filter(item => item.value > 0);
  }, [operatorStats]);

  // Operator leaderboard (sorted by compliance)
  const operatorLeaderboard = useMemo(() => {
    return operatorStats
      .map(op => ({
        ...op,
        compliance_score: op.total_overdue === 0 ? 100 : Math.max(0, 100 - (op.total_overdue * 10))
      }))
      .sort((a, b) => b.compliance_score - a.compliance_score)
      .slice(0, 10);
  }, [operatorStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Timesheet & Compliance Reports</h2>
          <p className="text-muted-foreground">
            Monitor timesheet submission compliance and track historical performance
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Compliance Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Historical Analytics</TabsTrigger>
          <TabsTrigger value="leaderboard">Operator Rankings</TabsTrigger>
          <TabsTrigger value="detailed">Detailed History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{complianceMetrics.complianceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {complianceMetrics.onTimeSubmissions} of {complianceMetrics.totalOperators} operators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{complianceMetrics.totalOverdueItems}</div>
                <p className="text-xs text-muted-foreground">
                  Across {complianceMetrics.operatorsWithOverdue} operators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{complianceMetrics.criticalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delay</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{complianceMetrics.avgOverdueDays} days</div>
                <p className="text-xs text-muted-foreground">
                  Average overdue period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Escalation Breakdown
                </CardTitle>
                <CardDescription>Distribution of overdue timesheet severity</CardDescription>
              </CardHeader>
              <CardContent>
                {escalationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={escalationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {escalationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    No overdue timesheets
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Compliance Issues
                </CardTitle>
                <CardDescription>Operators requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {operatorStats
                    .filter(op => op.total_overdue > 0)
                    .sort((a, b) => b.total_overdue - a.total_overdue)
                    .slice(0, 5)
                    .map((operator) => (
                      <div key={operator.operator_id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{operator.operator_name}</p>
                          <p className="text-sm text-muted-foreground">{operator.operator_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{operator.total_overdue} overdue</Badge>
                          <Badge variant={
                            operator.highest_escalation === 'critical' ? 'destructive' :
                            operator.highest_escalation === 'late' ? 'secondary' : 'default'
                          }>
                            {operator.highest_escalation}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {operatorStats.filter(op => op.total_overdue > 0).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      All operators are up to date!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                30-Day Compliance Trend
              </CardTitle>
              <CardDescription>
                Daily timesheet submission compliance rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={complianceHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'compliance' ? `${typeof value === 'number' ? value.toFixed(1) : value}%` : value,
                      name === 'compliance' ? 'Compliance Rate' : 
                      name === 'submitted' ? 'Submitted' :
                      name === 'overdue' ? 'Overdue' : 'Total'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="compliance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Submission Patterns
              </CardTitle>
              <CardDescription>
                Timesheet submission volume over the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={complianceHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submitted" fill="hsl(var(--primary))" name="Submitted" />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Operator Compliance Leaderboard
              </CardTitle>
              <CardDescription>
                Ranked by timesheet submission compliance score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operatorLeaderboard.map((operator, index) => (
                  <div 
                    key={operator.operator_id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{operator.operator_name}</p>
                        <p className="text-sm text-muted-foreground">{operator.operator_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{operator.compliance_score}%</p>
                        <p className="text-sm text-muted-foreground">
                          {operator.total_overdue === 0 ? 'Perfect' : `${operator.total_overdue} overdue`}
                        </p>
                      </div>
                      {operator.total_overdue === 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historical Timesheet Records
              </CardTitle>
              <CardDescription>
                Detailed view of all timesheet submissions and compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimesheetFilters
                  onFiltersChange={handleFiltersChange}
                />
                <TimesheetDataTable 
                  mode="manage" 
                  filters={filters}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}