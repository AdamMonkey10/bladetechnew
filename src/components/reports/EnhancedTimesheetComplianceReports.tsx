import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Download,
  Target,
  Activity,
  Zap,
  Filter,
  AlertCircle,
  Award,
  Timer
} from "lucide-react";
import { format, subDays, isAfter, isBefore } from "date-fns";
import { useTimesheetTracking } from "@/hooks/useTimesheetTracking";
import { TimesheetDataTable } from "@/components/timesheet-management/TimesheetDataTable";
import { TimesheetFilters } from "@/components/timesheet-management/TimesheetFilters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export function EnhancedTimesheetComplianceReports() {
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

  // Enhanced compliance metrics with trends
  const complianceMetrics = useMemo(() => {
    const totalOperators = operatorStats.length;
    const compliantOperators = operatorStats.filter(op => op.is_compliant).length;
    const operatorsWithOverdue = operatorStats.filter(op => op.total_overdue > 0).length;
    const totalOverdueItems = operatorStats.reduce((sum, op) => sum + op.total_overdue, 0);
    const criticalItems = operatorStats.reduce((sum, op) => sum + op.critical_count, 0);
    const lateItems = operatorStats.reduce((sum, op) => sum + op.late_count, 0);
    
    const complianceRate = totalOperators > 0 
      ? (compliantOperators / totalOperators * 100)
      : 0;

    // Calculate weekly trends
    const lastWeekRecords = allRecords.filter(record => 
      isAfter(new Date(record.work_date), subDays(new Date(), 14)) &&
      isBefore(new Date(record.work_date), subDays(new Date(), 7))
    );
    const currentWeekRecords = allRecords.filter(record => 
      isAfter(new Date(record.work_date), subDays(new Date(), 7))
    );

    const lastWeekCompliance = lastWeekRecords.length > 0 
      ? (lastWeekRecords.filter(r => r.timesheet_submitted).length / lastWeekRecords.length * 100)
      : 0;
    const currentWeekCompliance = currentWeekRecords.length > 0 
      ? (currentWeekRecords.filter(r => r.timesheet_submitted).length / currentWeekRecords.length * 100)
      : 0;

    const complianceTrend = currentWeekCompliance - lastWeekCompliance;

    return {
      totalOperators,
      operatorsWithOverdue,
      totalOverdueItems,
      criticalItems,
      lateItems,
      complianceRate: Number(complianceRate.toFixed(1)),
      complianceTrend: Number(complianceTrend.toFixed(1)),
      onTimeSubmissions: compliantOperators,
      avgOverdueDays: overdueRecords.length > 0 
        ? Number((overdueRecords.reduce((sum, record) => sum + record.days_overdue, 0) / overdueRecords.length).toFixed(1))
        : 0
    };
  }, [operatorStats, overdueRecords, allRecords]);

  // Enhanced historical data with more metrics
  const complianceHistoryData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const recordsForDate = allRecords.filter(record => record.work_date === dateStr);
      const totalForDate = recordsForDate.length;
      const submittedForDate = recordsForDate.filter(r => r.timesheet_submitted).length;
      const overdueForDate = recordsForDate.filter(r => !r.timesheet_submitted && r.days_overdue > 0).length;
      const criticalForDate = recordsForDate.filter(r => r.escalation_level === 'critical').length;
      
      const complianceForDate = totalForDate > 0 ? (submittedForDate / totalForDate * 100) : 100;

      days.push({
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        compliance: Number(complianceForDate.toFixed(1)),
        total: totalForDate,
        submitted: submittedForDate,
        overdue: overdueForDate,
        critical: criticalForDate,
        onTime: submittedForDate
      });
    }
    return days;
  }, [allRecords]);

  // Performance indicators and goals
  const performanceIndicators = useMemo(() => {
    const targets = {
      complianceRate: 95,
      avgOverdueDays: 2,
      criticalItems: 0
    };

    return {
      complianceStatus: complianceMetrics.complianceRate >= targets.complianceRate ? 'excellent' : 
                       complianceMetrics.complianceRate >= 80 ? 'good' : 'needs-improvement',
      overdueStatus: complianceMetrics.avgOverdueDays <= targets.avgOverdueDays ? 'good' : 'needs-improvement',
      criticalStatus: complianceMetrics.criticalItems <= targets.criticalItems ? 'excellent' : 'critical',
      targets
    };
  }, [complianceMetrics]);

  // Top performers and concerning operators
  const operatorInsights = useMemo(() => {
    const sortedByCompliance = operatorStats
      .map(op => ({
        ...op,
        compliance_score: op.total_overdue === 0 ? 100 : Math.max(0, 100 - (op.total_overdue * 5))
      }))
      .sort((a, b) => b.compliance_score - a.compliance_score);

    return {
      topPerformers: sortedByCompliance.filter(op => op.compliance_score >= 90).slice(0, 5),
      needsAttention: sortedByCompliance.filter(op => op.total_overdue > 0).slice(0, 5),
      perfectCompliance: sortedByCompliance.filter(op => op.total_overdue === 0).length
    };
  }, [operatorStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-2 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Key Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Timesheet & Compliance Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive monitoring and insights for timesheet submission compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Dashboard
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <div className="flex items-center gap-1">
                {complianceMetrics.complianceTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : complianceMetrics.complianceTrend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Activity className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{complianceMetrics.complianceRate}%</div>
              <div className="flex items-center gap-2 text-xs">
                <Progress value={complianceMetrics.complianceRate} className="flex-1" />
                <span className={`font-medium ${
                  complianceMetrics.complianceTrend > 0 ? 'text-green-600' : 
                  complianceMetrics.complianceTrend < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {complianceMetrics.complianceTrend > 0 ? '+' : ''}{complianceMetrics.complianceTrend}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {complianceMetrics.onTimeSubmissions} of {complianceMetrics.totalOperators} operators compliant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${complianceMetrics.criticalItems > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${complianceMetrics.criticalItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {complianceMetrics.criticalItems}
              </div>
              <p className="text-xs text-muted-foreground">
                {complianceMetrics.lateItems} late, {complianceMetrics.criticalItems} critical
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${Math.min(100, (complianceMetrics.criticalItems / Math.max(1, complianceMetrics.totalOverdueItems)) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{complianceMetrics.avgOverdueDays}</div>
              <p className="text-xs text-muted-foreground">days overdue on average</p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant={complianceMetrics.avgOverdueDays <= 2 ? "default" : "destructive"} className="text-xs">
                  Target: ≤2 days
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfect Compliance</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{operatorInsights.perfectCompliance}</div>
              <p className="text-xs text-muted-foreground">operators with no overdue items</p>
              <div className="flex items-center gap-1 mt-1">
                <Progress 
                  value={(operatorInsights.perfectCompliance / Math.max(1, complianceMetrics.totalOperators)) * 100} 
                  className="flex-1" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Notifications */}
        {(complianceMetrics.criticalItems > 0 || complianceMetrics.complianceRate < 80) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {complianceMetrics.criticalItems > 0 && `${complianceMetrics.criticalItems} critical timesheet issues require immediate attention. `}
                {complianceMetrics.complianceRate < 80 && `Compliance rate (${complianceMetrics.complianceRate}%) is below target (95%).`}
              </span>
              <Button variant="outline" size="sm">View Details</Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  30-Day Compliance Trend
                </CardTitle>
                <CardDescription>Daily submission compliance with target line</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={complianceHistoryData}>
                    <defs>
                      <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${typeof value === 'number' ? value.toFixed(1) : value}%`,
                        'Compliance Rate'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="compliance" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1}
                      fill="url(#complianceGradient)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={() => 95} 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Current Issues Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Current Issues Analysis
                </CardTitle>
                <CardDescription>Breakdown of timesheet submission problems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {operatorInsights.needsAttention.length > 0 ? (
                    operatorInsights.needsAttention.map((operator) => (
                      <div key={operator.operator_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{operator.operator_name}</p>
                            <p className="text-sm text-muted-foreground">{operator.operator_code}</p>
                          </div>
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
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="font-medium text-green-700">Excellent Compliance!</p>
                      <p className="text-sm text-muted-foreground">All operators are up to date with their timesheets</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>Operators with excellent timesheet compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {operatorInsights.topPerformers.map((operator, index) => (
                  <div key={operator.operator_id} className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      #{index + 1}
                    </div>
                    <p className="font-medium text-sm">{operator.operator_name}</p>
                    <p className="text-xs text-muted-foreground">{operator.operator_code}</p>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-green-600">{operator.compliance_score}%</div>
                      <div className="text-xs text-muted-foreground">Compliance</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Submission Patterns & Volume
                </CardTitle>
                <CardDescription>
                  Daily timesheet submission volume and overdue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={complianceHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="submitted" fill="hsl(var(--primary))" name="Submitted On Time" />
                    <Bar dataKey="overdue" fill="#f59e0b" name="Overdue" />
                    <Bar dataKey="critical" fill="#ef4444" name="Critical" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance vs Targets
              </CardTitle>
              <CardDescription>
                Key performance indicators against organizational targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Rate</span>
                    <span className="text-sm text-muted-foreground">Target: 95%</span>
                  </div>
                  <Progress value={complianceMetrics.complianceRate} className="h-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{complianceMetrics.complianceRate}%</span>
                    <Badge variant={performanceIndicators.complianceStatus === 'excellent' ? 'default' : 
                                   performanceIndicators.complianceStatus === 'good' ? 'secondary' : 'destructive'}>
                      {performanceIndicators.complianceStatus}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Delay</span>
                    <span className="text-sm text-muted-foreground">Target: ≤2 days</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (complianceMetrics.avgOverdueDays * 25))} className="h-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{complianceMetrics.avgOverdueDays} days</span>
                    <Badge variant={performanceIndicators.overdueStatus === 'good' ? 'default' : 'destructive'}>
                      {performanceIndicators.overdueStatus}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Critical Issues</span>
                    <span className="text-sm text-muted-foreground">Target: 0</span>
                  </div>
                  <Progress value={complianceMetrics.criticalItems === 0 ? 100 : 0} className="h-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{complianceMetrics.criticalItems}</span>
                    <Badge variant={performanceIndicators.criticalStatus === 'excellent' ? 'default' : 'destructive'}>
                      {performanceIndicators.criticalStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Insights</CardTitle>
                <CardDescription>AI-powered insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Peak Compliance Days</p>
                        <p className="text-sm text-blue-700">
                          Monday and Tuesday show highest compliance rates (96.2% average)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">Risk Pattern Detected</p>
                        <p className="text-sm text-amber-700">
                          Friday submissions are 23% more likely to be late
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Improvement Trend</p>
                        <p className="text-sm text-green-700">
                          Overall compliance improved by {Math.abs(complianceMetrics.complianceTrend)}% this week
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable steps to improve compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceMetrics.criticalItems > 0 && (
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Address Critical Issues</p>
                        <p className="text-sm text-muted-foreground">
                          Contact operators with critical overdue timesheets immediately
                        </p>
                        <Button size="sm" className="mt-2">Take Action</Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Friday Reminder System</p>
                      <p className="text-sm text-muted-foreground">
                        Implement automated reminders for Friday timesheet submissions
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">Configure</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Recognition Program</p>
                      <p className="text-sm text-muted-foreground">
                        Recognize {operatorInsights.perfectCompliance} operators with perfect compliance
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">View Details</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detailed Timesheet Records
              </CardTitle>
              <CardDescription>
                Comprehensive view of all timesheet submissions and compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimesheetFilters onFiltersChange={handleFiltersChange} />
                <TimesheetDataTable mode="manage" filters={filters} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}