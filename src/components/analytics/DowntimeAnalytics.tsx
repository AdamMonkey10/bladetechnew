import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DowntimeData {
  activity_type: string;
  downtime_reason: string;
  total_hours: number;
  occurrence_count: number;
  avg_duration: number;
}

interface DowntimeSummary {
  total_downtime_hours: number;
  total_production_hours: number;
  downtime_percentage: number;
  by_reason: DowntimeData[];
  by_activity: DowntimeData[];
}

export function DowntimeAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });

  const { data: downtimeData, isLoading } = useQuery({
    queryKey: ['downtime-analytics', dateRange.from, dateRange.to],
    queryFn: async (): Promise<DowntimeSummary> => {
      const { data: shiftRecords, error } = await supabase
        .from('shift_records')
        .select('production_data, shift_date')
        .gte('shift_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('shift_date', format(dateRange.to, 'yyyy-MM-dd'))
        .not('production_data', 'is', null);

      if (error) throw error;

      const downtimeByReason: Record<string, DowntimeData> = {};
      const downtimeByActivity: Record<string, DowntimeData> = {};
      let totalDowntimeHours = 0;
      let totalProductionHours = 0;

      shiftRecords?.forEach(record => {
        const productionData = record.production_data as any;
        const activities = productionData?.activities || [];
        
        activities.forEach((activity: any) => {
          const activityName = activity.name;
          
          activity.entries?.forEach((entry: any) => {
            // Count production time
            if (entry.time_spent) {
              totalProductionHours += parseFloat(entry.time_spent);
            }

            // Count downtime
            if (entry.downtime_duration && parseFloat(entry.downtime_duration) > 0) {
              const downtimeHours = parseFloat(entry.downtime_duration);
              const reason = entry.downtime_reason || 'Unspecified';
              
              totalDowntimeHours += downtimeHours;

              // Group by reason
              if (!downtimeByReason[reason]) {
                downtimeByReason[reason] = {
                  activity_type: '',
                  downtime_reason: reason,
                  total_hours: 0,
                  occurrence_count: 0,
                  avg_duration: 0
                };
              }
              downtimeByReason[reason].total_hours += downtimeHours;
              downtimeByReason[reason].occurrence_count += 1;

              // Group by activity
              const activityKey = `${activityName}-${reason}`;
              if (!downtimeByActivity[activityKey]) {
                downtimeByActivity[activityKey] = {
                  activity_type: activityName,
                  downtime_reason: reason,
                  total_hours: 0,
                  occurrence_count: 0,
                  avg_duration: 0
                };
              }
              downtimeByActivity[activityKey].total_hours += downtimeHours;
              downtimeByActivity[activityKey].occurrence_count += 1;
            }
          });
        });
      });

      // Calculate averages
      Object.values(downtimeByReason).forEach(item => {
        item.avg_duration = item.total_hours / item.occurrence_count;
      });
      Object.values(downtimeByActivity).forEach(item => {
        item.avg_duration = item.total_hours / item.occurrence_count;
      });

      const downtimePercentage = totalProductionHours > 0 
        ? (totalDowntimeHours / (totalProductionHours + totalDowntimeHours)) * 100 
        : 0;

      return {
        total_downtime_hours: totalDowntimeHours,
        total_production_hours: totalProductionHours,
        downtime_percentage: downtimePercentage,
        by_reason: Object.values(downtimeByReason).sort((a, b) => b.total_hours - a.total_hours),
        by_activity: Object.values(downtimeByActivity).sort((a, b) => b.total_hours - a.total_hours)
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const getReasonColor = (reason: string): string => {
    const colors: Record<string, string> = {
      'Breakdown': 'destructive',
      'Setup/Changeover': 'secondary',
      'Maintenance': 'outline',
      'Waiting for Instructions': 'default',
      'Training': 'secondary',
      'Other': 'outline',
      'Unspecified': 'destructive'
    };
    return colors[reason] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Downtime Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze production downtime across all activities
          </p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) {
                    setDateRange({
                      from: range.from,
                      to: range.to || range.from
                    });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : downtimeData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{downtimeData.total_downtime_hours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Across all activities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production Time</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{downtimeData.total_production_hours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Active production time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downtime %</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{downtimeData.downtime_percentage.toFixed(1)}%</div>
                <Progress value={downtimeData.downtime_percentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {downtimeData.by_reason.reduce((sum, item) => sum + item.occurrence_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total downtime events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Downtime by Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Downtime by Reason</CardTitle>
              <CardDescription>
                Breakdown of downtime hours by cause
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {downtimeData.by_reason.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={getReasonColor(item.downtime_reason) as any}>
                        {item.downtime_reason}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.total_hours.toFixed(1)} hours</p>
                        <p className="text-sm text-muted-foreground">
                          {item.occurrence_count} incidents • Avg: {item.avg_duration.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {((item.total_hours / downtimeData.total_downtime_hours) * 100).toFixed(1)}%
                      </p>
                      <Progress 
                        value={(item.total_hours / downtimeData.total_downtime_hours) * 100} 
                        className="w-20 mt-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Downtime by Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Downtime by Activity & Reason</CardTitle>
              <CardDescription>
                Detailed breakdown showing which activities are affected most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {downtimeData.by_activity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.activity_type}</Badge>
                      <Badge variant={getReasonColor(item.downtime_reason) as any} className="text-xs">
                        {item.downtime_reason}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.total_hours.toFixed(1)} hours</p>
                        <p className="text-sm text-muted-foreground">
                          {item.occurrence_count} incidents
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Avg: {item.avg_duration.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No downtime data found for the selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}