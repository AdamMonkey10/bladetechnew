
import { useState, useMemo } from 'react';
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
import { OEESettingsDialog } from '@/components/analytics/OEESettingsDialog';
import { OEETimeSeriesChart } from '@/components/analytics/OEETimeSeriesChart';
import { OEEComparisonChart } from '@/components/analytics/OEEComparisonChart';
import { OEEDataQualityPanel } from '@/components/analytics/OEEDataQualityPanel';
import { OEESummaryPopulator } from '@/components/analytics/OEESummaryPopulator';
import { 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Target, 
  Loader2,
  Calendar as CalendarIcon,
  ArrowLeft,
  Download
} from 'lucide-react';
import { formatDate, getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange } from '@/utils/dateUtils';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link, useSearchParams } from 'react-router-dom';

const ACTIVITY_TYPES = ['Laser1', 'Laser2', 'Laser3', 'Welder'];

export default function OEE() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    const paramDate = searchParams.get('startDate');
    return paramDate ? new Date(paramDate) : subDays(new Date(), 30);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const paramDate = searchParams.get('endDate');
    return paramDate ? new Date(paramDate) : new Date();
  });
  const [selectedActivities, setSelectedActivities] = useState<string[]>(ACTIVITY_TYPES);
  const [chartMetric, setChartMetric] = useState<'oee_247' | 'oee_booked' | 'availability_247' | 'performance_247' | 'performance_booked' | 'quality'>('oee_247');

  const { toast } = useToast();
  const { 
    targetRates, 
    updateAllRates, 
    resetToDefaults, 
    defaultRates 
  } = useOEESettings();

  const filters = useMemo(() => ({
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  }), [startDate, endDate]);

  const timeSeriesFilters = useMemo(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate,
    activityTypes: selectedActivities,
  }), [filters, selectedActivities]);

  const { data: currentOeeData, isLoading: currentLoading } = useOEECalculations(targetRates, targetRates, filters);
  const { data: timeSeriesData, isLoading: timeSeriesLoading, error: timeSeriesError } = useOEETimeSeries(targetRates, timeSeriesFilters);

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
    
    setStartDate(newStart);
    setEndDate(newEnd);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('startDate', format(newStart, 'yyyy-MM-dd'));
    params.set('endDate', format(newEnd, 'yyyy-MM-dd'));
    setSearchParams(params);
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

  if (currentLoading || timeSeriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Overall Equipment Effectiveness (OEE)</h1>
            <p className="text-muted-foreground">Comprehensive OEE analysis and trends</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading OEE data...</span>
        </div>
      </div>
    );
  }

  if (timeSeriesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Overall Equipment Effectiveness (OEE)</h1>
            <p className="text-muted-foreground">Comprehensive OEE analysis and trends</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading OEE Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load OEE time series data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link to="/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8" />
              Overall Equipment Effectiveness (OEE)
            </h1>
            <p className="text-muted-foreground">
              Comprehensive OEE analysis, trends, and performance tracking
            </p>
            {currentOeeData?.summary.periodDescription && (
              <p className="text-sm text-blue-600 font-medium mt-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Period: {currentOeeData.summary.periodDescription} ({currentOeeData.summary.periodHours}h)
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Configure Rates
          </Button>
          <Button variant="outline" className="gap-2">
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
                  {startDate ? formatDate(startDate) : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
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
                  onSelect={(date) => date && setEndDate(date)}
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
        </div>
      </Card>

      {/* Current Period Summary */}
      {currentOeeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Units Produced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.totalUnits.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Booked Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.totalBookedHours.toFixed(1)}h</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Period Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOeeData.summary.periodHours}h</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Activity Comparison</TabsTrigger>
          <TabsTrigger value="current">Current Period Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Activity Performance Comparison</h3>
          
          {timeSeriesData && timeSeriesData.length > 0 ? (
            <OEEComparisonChart data={timeSeriesData} />
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Target: {(activity.bookedTargetRate * activity.timeSpent).toLocaleString()} units
                          </Badge>
                          <Badge variant="outline">
                            Actual: {activity.actualUnits.toLocaleString()} units
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">
                            {formatMetric(activity.oeeBookedTime.oee)}
                          </div>
                          <Badge variant={getOEEBadgeVariant(activity.oeeBookedTime.oee)}>
                            {activity.actualRate > activity.bookedTargetRate ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            Booked OEE
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Availability:</span>
                            <span>{formatMetric(activity.oeeBookedTime.availability)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Performance:</span>
                            <span>{formatMetric(activity.oeeBookedTime.performance)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Quality:</span>
                            <span>{formatMetric(activity.oeeBookedTime.quality)}</span>
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
                <p className="text-muted-foreground">No current period data available.</p>
              </CardContent>
            </Card>
          )}
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
