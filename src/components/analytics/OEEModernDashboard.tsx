import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Target, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface OEEData {
  oee247: number;
  oeeBooked: number;
  availability247: number;
  availabilityBooked: number;
  performance247: number;
  performanceBooked: number;
  quality: number;
  totalUnits: number;
  totalTime: number;
  bookedTime: number;
  activity?: string;
}

interface OEEModernDashboardProps {
  data: OEEData[];
  isLoading?: boolean;
}

const getPerformanceColor = (value: number) => {
  if (value >= 85) return "text-green-600 dark:text-green-400";
  if (value >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getPerformanceBadge = (value: number) => {
  if (value >= 85) return { variant: "default" as const, label: "Excellent" };
  if (value >= 70) return { variant: "secondary" as const, label: "Good" };
  return { variant: "destructive" as const, label: "Needs Attention" };
};

const getTrendIcon = (current: number, target: number = 85) => {
  if (current > target) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (current < target - 10) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-yellow-500" />;
};

const DualMetricCard = ({ 
  title, 
  value247, 
  valueBooked,
  icon: Icon, 
  target = 85, 
  suffix = "%",
  showProgress = true 
}: {
  title: string;
  value247: number;
  valueBooked: number;
  icon: React.ComponentType<any>;
  target?: number;
  suffix?: string;
  showProgress?: boolean;
}) => {
  const badge247 = getPerformanceBadge(value247);
  const badgeBooked = getPerformanceBadge(valueBooked);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 24/7 Metric */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">24/7 Operation</span>
              <Badge variant={badge247.variant} className="text-xs">
                {badge247.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold ${getPerformanceColor(value247)}`}>
                {value247.toFixed(1)}{suffix}
              </span>
              {getTrendIcon(value247, target)}
            </div>
            {showProgress && (
              <Progress value={Math.min(value247, 100)} className="h-1.5" />
            )}
          </div>
          
          {/* Separator */}
          <div className="border-t border-muted/30"></div>
          
          {/* Booked Time Metric */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Scheduled Time</span>
              <Badge variant={badgeBooked.variant} className="text-xs">
                {badgeBooked.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold ${getPerformanceColor(valueBooked)}`}>
                {valueBooked.toFixed(1)}{suffix}
              </span>
              {getTrendIcon(valueBooked, target)}
            </div>
            {showProgress && (
              <Progress value={Math.min(valueBooked, 100)} className="h-1.5" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OEEOverallCard = ({ data }: { data: OEEData }) => {
  const utilizationRate = data.totalTime > 0 ? (data.bookedTime / data.totalTime) * 100 : 0;
  
  return (
    <Card className="col-span-full bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Overall Equipment Effectiveness (OEE)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 24/7 OEE */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">24/7 Operation</div>
            <div className={`text-3xl font-bold ${getPerformanceColor(data.oee247)}`}>
              {data.oee247.toFixed(1)}%
            </div>
            <Badge variant={getPerformanceBadge(data.oee247).variant} className="text-xs">
              {getPerformanceBadge(data.oee247).label}
            </Badge>
            <Progress value={Math.min(data.oee247, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground">
              Total equipment utilization
            </div>
          </div>
          
          {/* Booked Time OEE */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Scheduled Time</div>
            <div className={`text-3xl font-bold ${getPerformanceColor(data.oeeBooked)}`}>
              {data.oeeBooked.toFixed(1)}%
            </div>
            <Badge variant={getPerformanceBadge(data.oeeBooked).variant} className="text-xs">
              {getPerformanceBadge(data.oeeBooked).label}
            </Badge>
            <Progress value={Math.min(data.oeeBooked, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground">
              Efficiency during scheduled hours
            </div>
          </div>
          
          {/* Production Summary */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Production Summary</div>
            <div className="text-2xl font-bold text-foreground">
              {data.totalUnits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">units produced</div>
            {data.activity && (
              <div className="text-xs text-muted-foreground">
                Activity: {data.activity}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function OEEModernDashboard({ data, isLoading }: OEEModernDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No OEE data available</p>
        </CardContent>
      </Card>
    );
  }

  // Use the first data point for the overall card, or aggregate if multiple
  const overallData = data[0];
  
  return (
    <div className="space-y-6">
      {/* Overall OEE Card */}
      <OEEOverallCard data={overallData} />
      
      {/* Quality Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getPerformanceColor(overallData.quality)}`}>
                  {overallData.quality.toFixed(1)}%
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(overallData.quality, 99)}
                  <Badge variant={getPerformanceBadge(overallData.quality).variant} className="text-xs">
                    {getPerformanceBadge(overallData.quality).label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>Target: 99%</span>
                </div>
                <Progress value={Math.min(overallData.quality, 100)} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                Same for both 24/7 and scheduled time
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units Produced</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overallData.totalUnits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              units produced in period
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Multiple Activities */}
      {data.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((activity, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {activity.activity || `Activity ${index + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Activity OEE Overview
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">24/7 OEE</div>
                          <div className={`font-bold ${getPerformanceColor(activity.oee247 || 0)}`}>
                            {(activity.oee247 || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Scheduled OEE</div>
                          <div className={`font-bold ${getPerformanceColor(activity.oeeBooked || 0)}`}>
                            {(activity.oeeBooked || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Avail</div>
                          <div className="font-semibold">{(activity.availability247 || 0).toFixed(1)}%</div>
                          <div className="font-semibold text-muted-foreground">{(activity.availabilityBooked || 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Perf</div>
                          <div className="font-semibold">{(activity.performance247 || 0).toFixed(1)}%</div>
                          <div className="font-semibold text-muted-foreground">{(activity.performanceBooked || 0).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Qual</div>
                          <div className="font-semibold">{(activity.quality || 0).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={Math.min(activity.oee247 || 0, 100)} className="h-1.5" />
                      <Progress value={Math.min(activity.oeeBooked || 0, 100)} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}