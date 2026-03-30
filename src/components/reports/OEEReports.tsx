import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useOEESettings } from '@/hooks/useOEESettings';
import { useOEECalculations } from '@/hooks/useOEECalculations';
import { useOEETimeSeries } from '@/hooks/useOEETimeSeries';
import { useOperatorShiftBreakdown } from '@/hooks/useOperatorShiftBreakdown';
import { OEESettingsDialog } from '@/components/analytics/OEESettingsDialog';
import { OEETimeSeriesChart } from '@/components/analytics/OEETimeSeriesChart';
import { OEEModernDashboard } from '@/components/analytics/OEEModernDashboard';
import { OEEDataQualityPanel } from '@/components/analytics/OEEDataQualityPanel';
import { OEESummaryPopulator } from '@/components/analytics/OEESummaryPopulator';
import { OperatorShiftBreakdown } from '@/components/analytics/OperatorShiftBreakdown';
import { WeeklyBreakdown } from '@/components/analytics/WeeklyBreakdown';
import { 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Target, 
  Calendar as CalendarIcon,
  Download,
  Loader2
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { formatDate, getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_TYPES = ['Laser1', 'Laser2', 'Laser3', 'Welder'];

export function OEEReports() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(ACTIVITY_TYPES);
  const [chartMetric, setChartMetric] = useState<'oee_247' | 'oee_booked' | 'availability_247' | 'performance_247' | 'performance_booked' | 'quality'>('oee_247');
  const [view, setView] = useState<'overview' | 'detailed'>('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { toast } = useToast();
  const { 
    targetRates, 
    updateAllRates, 
    resetToDefaults, 
    defaultRates 
  } = useOEESettings();

  const filters = useMemo(() => ({
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  }), [dateRange]);

  const timeSeriesFilters = useMemo(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate,
    activityTypes: selectedActivities,
  }), [filters, selectedActivities]);

  const { data: currentOeeData, isLoading: currentLoading } = useOEECalculations(targetRates, targetRates, filters);
  const { data: timeSeriesData, isLoading: timeSeriesLoading, error: timeSeriesError } = useOEETimeSeries(targetRates, timeSeriesFilters);
  const { data: operatorShiftData, isLoading: operatorShiftLoading } = useOperatorShiftBreakdown(filters, {
    Laser1: targetRates.Laser || 500,
    Laser2: targetRates.Laser || 500,
    Laser3: targetRates.Laser || 500,
    Welder: targetRates.Welder || 167,
  });

  const handleQuickDateRange = (range: string) => {
    let newStart: Date, newEnd: Date;
    
    switch (range) {
      case 'thisWeek':
        ({ start: newStart, end: newEnd } = getThisWeekRange());
        break;
      case 'lastWeek':
        ({ start: newStart, end: newEnd } = getLastWeekRange());
        break;
      case 'thisMonth':
        ({ start: newStart, end: newEnd } = getThisMonthRange());
        break;
      case 'lastMonth':
        ({ start: newStart, end: newEnd } = getLastMonthRange());
        break;
      case '7days':
        newStart = subDays(new Date(), 7);
        newEnd = new Date();
        break;
      case '30days':
      default:
        newStart = subDays(new Date(), 30);
        newEnd = new Date();
        break;
    }
    
    setDateRange({ from: newStart, to: newEnd });
  };

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const getOEEBadgeVariant = (oee: number): "default" | "secondary" | "destructive" | "outline" => {
    if (oee >= 85) return 'default';
    if (oee >= 70) return 'secondary';
    return 'destructive';
  };

  const formatMetric = (value: number, suffix: string = '%') => {
    return `${value.toFixed(1)}${suffix}`;
  };

  const getChartTitle = (metric: string) => {
    const titles = {
      'oee_247': 'OEE 24/7 Trends',
      'oee_booked': 'OEE Booked Time Trends',
      'availability_247': 'Availability 24/7 Trends',
      'performance_247': 'Performance 24/7 Trends',
      'performance_booked': 'Performance Booked Time Trends',
      'quality': 'Quality Trends',
    };
    return titles[metric as keyof typeof titles] || 'OEE Trends';
  };

  const exportOEEReport = () => {
    if (!currentOeeData && !timeSeriesData) {
      toast({
        title: "No data to export",
        description: "Please wait for data to load or select a different date range.",
        variant: "destructive",
      });
      return;
    }

    let csvData: any[] = [];
    
    if (timeSeriesData && timeSeriesData.length > 0) {
      csvData = timeSeriesData.map(row => ({
        Date: row.date,
        Activity: row.activity_type,
        'OEE 24/7': row.oee_247,
        'OEE Booked': row.oee_booked,
        'Availability 24/7': row.availability_247,
        'Performance 24/7': row.performance_247,
        'Performance Booked': row.performance_booked,
        Quality: row.quality,
        'Total Units': row.total_units,
        'Total Time': row.total_time,
        'Booked Hours': row.booked_hours
      }));
    } else if (currentOeeData) {
      csvData = currentOeeData.activityOEE.map(activity => ({
        Activity: activity.activityType,
        'Units Produced': activity.actualUnits,
        'Time Spent (h)': activity.timeSpent,
        'Target Rate (24/7)': activity.target247Rate,
        'Target Rate (Booked)': activity.bookedTargetRate,
        'OEE 24/7': activity.oee24_7.oee,
        'Availability 24/7': activity.oee24_7.availability,
        'Performance 24/7': activity.oee24_7.performance,
        'Quality 24/7': activity.oee24_7.quality,
        'OEE Booked': activity.oeeBookedTime.oee,
        'Performance Booked': activity.oeeBookedTime.performance
      }));
    }
    
    if (csvData.length === 0) {
      toast({
        title: "No data to export",
        description: "No OEE data available for the selected period.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0]).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `oee_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "OEE report has been downloaded as CSV.",
    });
  };

  if (currentLoading || timeSeriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading OEE data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            OEE & Performance Analysis
          </h2>
          <p className="text-muted-foreground">
            Overall Equipment Effectiveness with advanced analytics and target management
          </p>
          {currentOeeData?.summary.periodDescription && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Period: {currentOeeData.summary.periodDescription} ({currentOeeData.summary.periodHours}h)
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Configure Rates
          </Button>
          <Button variant="outline" onClick={exportOEEReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Date Ranges */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('7days')}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('30days')}>
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('thisWeek')}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('thisMonth')}>
              This Month
            </Button>
          </div>
          
          {/* Date Pickers */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? formatDate(dateRange.from) : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? formatDate(dateRange.to) : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Activity Filter */}
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Activities:</span>
            {ACTIVITY_TYPES.map(activity => (
              <Badge
                key={activity}
                variant={selectedActivities.includes(activity) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleActivityToggle(activity)}
              >
                {activity}
              </Badge>
            ))}
          </div>
          
          {/* Chart Metric Selector - moved to timeseries tab */}
        </div>
      </Card>

      {/* Current Period Summary */}
      {currentOeeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Units Produced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.totalUnits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Period: {currentOeeData.summary.periodDescription}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Booked Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.totalBookedHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                of {currentOeeData.summary.periodHours}h total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Period Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.periodHours}h</div>
              <p className="text-xs text-muted-foreground">
                {currentOeeData.summary.periodDescription}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Scrap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.totalScrap?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                units scrapped
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Activity Comparison</TabsTrigger>
          <TabsTrigger value="current">Current Period Details</TabsTrigger>
          <TabsTrigger value="operators">Operator Breakdown</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Activity Performance Comparison</h3>
          
          {currentOeeData.overallOEE ? (
            <OEEModernDashboard data={[{
              oee247: currentOeeData.overallOEE.oee24_7.oee,
              oeeBooked: currentOeeData.overallOEE.oeeBookedTime.oee,
              availability247: currentOeeData.overallOEE.oee24_7.availability,
              availabilityBooked: currentOeeData.overallOEE.oeeBookedTime.availability,
              performance247: currentOeeData.overallOEE.oee24_7.performance,
              performanceBooked: currentOeeData.overallOEE.oeeBookedTime.performance,
              quality: currentOeeData.overallOEE.oee24_7.quality,
              totalUnits: currentOeeData.summary.totalUnits,
              totalTime: currentOeeData.summary.periodHours,
              bookedTime: currentOeeData.summary.totalBookedHours,
              activity: 'Overall'
            }, ...currentOeeData.activityOEE.map(activity => ({
              oee247: activity.oee24_7.oee,
              oeeBooked: activity.oeeBookedTime.oee,
              availability247: activity.oee24_7.availability,
              availabilityBooked: activity.oeeBookedTime.availability,
              performance247: activity.oee24_7.performance,
              performanceBooked: activity.oeeBookedTime.performance,
              quality: activity.oee24_7.quality,
              totalUnits: activity.actualUnits,
              totalTime: currentOeeData.summary.periodHours,
              bookedTime: activity.timeSpent,
              activity: activity.activityType
            }))]} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No comparison data available for the selected period and activities.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="current" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Current Period Activity Details</h3>
          
          {currentOeeData?.activityOEE && currentOeeData.activityOEE.length > 0 ? (
            <Tabs defaultValue="24-7" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="24-7" className="flex flex-col gap-1">
                  <span>24/7 OEE</span>
                  <span className="text-xs text-muted-foreground">vs. maximum capacity ({currentOeeData.summary.periodHours}h)</span>
                </TabsTrigger>
                <TabsTrigger value="booked" className="flex flex-col gap-1">
                  <span>Booked Time OEE</span>
                  <span className="text-xs text-muted-foreground">during scheduled hours only</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="24-7" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentOeeData.activityOEE.map((activity) => (
                    <Card key={activity.activityType} className="relative">
                       <CardHeader className="pb-3">
                        <CardTitle className="text-base">{activity.activityType}</CardTitle>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Ran: {activity.timeSpent.toFixed(1)}h / {currentOeeData.summary.periodHours}h
                            </Badge>
                            <Badge variant="outline" className={activity.oee24_7.availability < 50 ? "border-amber-500 text-amber-600" : ""}>
                              {formatMetric(activity.oee24_7.availability)} availability
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Target: {(activity.target247Rate * (currentOeeData.summary.periodHours || 168)).toLocaleString()} units
                            </Badge>
                            <Badge variant="outline">
                              Actual: {activity.actualUnits.toLocaleString()} units
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">
                            {formatMetric(activity.oee24_7.oee)}
                          </div>
                          <Badge variant={getOEEBadgeVariant(activity.oee24_7.oee)}>
                            {activity.actualRate > activity.target247Rate ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            24/7 OEE
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded">
                            <span className="font-medium">OEE Formula:</span>
                            <span>A × P × Q</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Availability (A):</span>
                            <span className={activity.oee24_7.availability < 50 ? "text-amber-600 font-medium" : ""}>{formatMetric(activity.oee24_7.availability)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Performance (P):</span>
                            <span>{formatMetric(activity.oee24_7.performance)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Quality (Q):</span>
                            <span>{formatMetric(activity.oee24_7.quality)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="booked" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentOeeData.activityOEE.map((activity) => (
                    <Card key={activity.activityType} className="relative">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{activity.activityType}</CardTitle>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Booked: {activity.timeSpent.toFixed(1)}h
                            </Badge>
                            <Badge variant="outline">
                              {formatMetric(100)} availability
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Target: {(activity.bookedTargetRate * activity.timeSpent).toLocaleString()} units
                            </Badge>
                            <Badge variant="outline">
                              Actual: {activity.actualUnits.toLocaleString()} units
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">
                            {formatMetric(activity.oeeBookedTime.oee)}
                          </div>
                          <Badge variant={getOEEBadgeVariant(activity.oeeBookedTime.oee)}>
                            <Zap className="h-3 w-3 mr-1" />
                            Booked OEE
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded">
                            <span className="font-medium">OEE Formula:</span>
                            <span>A × P × Q</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Availability (A):</span>
                            <span>{formatMetric(100)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Performance (P):</span>
                            <span>{formatMetric(activity.oeeBookedTime.performance)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Quality (Q):</span>
                            <span>{formatMetric(activity.oee24_7.quality)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No activity data available for the selected period.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="operators" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Operator Shift Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Detailed production performance by operator showing units produced, rates, and efficiency for each shift
          </p>
          
          <OperatorShiftBreakdown 
            data={operatorShiftData || []} 
            isLoading={operatorShiftLoading}
          />
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-4 mt-6">
          <WeeklyBreakdown />
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <OEESettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        targetRates={targetRates}
        defaultRates={defaultRates}
        onUpdateAllRates={updateAllRates}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}