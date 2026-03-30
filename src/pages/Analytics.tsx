import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useGenerateWeeklyReport } from '@/hooks/useWeeklyReports';
import { useReferenceData } from '@/hooks/useReferenceData';
import { Loader2, Calendar as CalendarIcon, Lock, FileDown } from 'lucide-react';
import { formatDate, getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPES } from '@/components/forms/shift-form-types';
import { ProductionInsights } from '@/components/ProductionInsights';
import { OEESummaryCard } from '@/components/analytics/OEESummaryCard';
import { OEEModernDashboard } from '@/components/analytics/OEEModernDashboard';
import { DowntimeAnalytics } from '@/components/analytics/DowntimeAnalytics';

export default function Analytics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Move all hooks to top level - ALWAYS call them
  const filters = useMemo(() => ({
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  }), [startDate, endDate]);

  const { data: analyticsData, isLoading, error } = useAnalytics(filters);
  const generateReport = useGenerateWeeklyReport();
  const { machines } = useReferenceData();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'monkey@64') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Analytics Access</CardTitle>
            <p className="text-muted-foreground">Enter password to view analytics dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <Button type="submit" className="w-full">
                Access Analytics
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleThisWeek = () => {
    const { start, end } = getThisWeekRange();
    setStartDate(start);
    setEndDate(end);
  };

  const handleLastWeek = () => {
    const { start, end } = getLastWeekRange();
    setStartDate(start);
    setEndDate(end);
  };

  const handleThisMonth = () => {
    const { start, end } = getThisMonthRange();
    setStartDate(start);
    setEndDate(end);
  };

  const handleLastMonth = () => {
    const { start, end } = getLastMonthRange();
    setStartDate(start);
    setEndDate(end);
  };

  const handleAvailableData = () => {
    // For available data range July 9-11, 2025
    const startOfRange = new Date('2025-07-09');
    const endOfRange = new Date('2025-07-11');
    endOfRange.setHours(23, 59, 59, 999); // End of day
    
    setStartDate(startOfRange);
    setEndDate(endOfRange);
  };

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleGenerateReport = async () => {
    try {
      let weekStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      
      // If no specific date is selected, use the current week start (Monday)
      if (!weekStartDate) {
        const today = new Date();
        const currentDay = today.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 0
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysFromMonday);
        weekStartDate = format(monday, 'yyyy-MM-dd');
      }

      const result = await generateReport.mutateAsync({ weekStartDate });
      
      toast({
        title: "Report Generated Successfully",
        description: result.message || "Weekly production report has been generated and saved.",
      });
    } catch (error) {
      toast({
        title: "Error Generating Report",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Production analytics and operator performance</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Production analytics and operator performance</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load analytics data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive performance metrics and insights
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="oee">OEE Dashboard</TabsTrigger>
          <TabsTrigger value="downtime">Downtime Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Production Overview</h2>
                <p className="text-muted-foreground">Key performance metrics and operator analytics</p>
              </div>

              <div className="flex gap-4">
                {/* Generate Report Button */}
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generateReport.isPending}
                  className="gap-2"
                >
                  {generateReport.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  Generate Report
                </Button>

                {/* Time Period Selector */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleThisWeek}>
                        This Week (Mon 6am)
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleLastWeek}>
                        Last Week
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleThisMonth}>
                        This Month
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleLastMonth}>
                        Last Month
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleAvailableData}>
                        Available Data (Jul 9-11)
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearDates}>
                        All Time
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? formatDate(startDate) : <span>Start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? formatDate(endDate) : <span>End date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Production Intelligence - Automatic Insights */}
            <ProductionInsights />

            {/* OEE Summary Card - Links to dedicated OEE page */}
            <OEESummaryCard filters={filters} />

            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-blue-800">Laser Units Produced</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">
                      {analyticsData.overallStats.laserStats?.totalUnits.toLocaleString() || '0'}
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      As entered in timesheets
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-800">Laser Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">
                      {analyticsData.overallStats.laserStats?.avgEfficiency.toFixed(1) || '0.0'} u/h
                    </div>
                    <p className="text-sm text-green-600 mt-1">From timesheet entries</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-purple-800">Laser Operators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">
                      {analyticsData.overallStats.laserStats?.operators || 0}
                    </div>
                    <p className="text-sm text-purple-600 mt-1">Active operators</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-orange-800">Date Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-orange-900">
                      {startDate && endDate ? (
                        <>
                          {formatDate(startDate)} - {formatDate(endDate)}
                        </>
                      ) : startDate ? (
                        `From ${formatDate(startDate)}`
                      ) : endDate ? (
                        `Until ${formatDate(endDate)}`
                      ) : (
                        'All Time'
                      )}
                    </div>
                    <p className="text-sm text-orange-600 mt-1">Analysis period</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="oee">
          <OEEModernDashboard data={[]} />
        </TabsContent>

        <TabsContent value="downtime">
          <DowntimeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}