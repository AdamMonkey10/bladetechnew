
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOEECalculations } from '@/hooks/useOEECalculations';
import { useOEESettings } from '@/hooks/useOEESettings';
import { Target, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

interface OEESummaryCardProps {
  filters?: AnalyticsFilters;
}

export const OEESummaryCard = ({ filters }: OEESummaryCardProps) => {
  const [searchParams] = useSearchParams();
  const { targetRates } = useOEESettings();
  const { data: oeeData, isLoading, error } = useOEECalculations(targetRates, targetRates, filters);

  const getOEEBadgeVariant = (oee: number): "default" | "secondary" | "destructive" | "outline" => {
    if (oee >= 85) return 'default';
    if (oee >= 70) return 'secondary';
    return 'destructive';
  };

  const formatMetric = (value: number, suffix: string = '%') => {
    return `${value.toFixed(1)}${suffix}`;
  };

  // Create URL with current filters
  const oeeUrl = `/oee?${searchParams.toString()}`;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading OEE summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !oeeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {error ? 'Error loading OEE data' : 'No OEE data available'}
            </p>
            <Link to={oeeUrl}>
              <Button variant="outline" className="gap-2">
                View Detailed Analysis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find top performing activity
  const topActivity = oeeData.activityOEE.reduce((prev, current) => {
    return (current.oee24_7.oee > prev.oee24_7.oee) ? current : prev;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Overall Equipment Effectiveness (OEE)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Production efficiency summary - {oeeData.summary.periodDescription}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {oeeData.summary.totalUnits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {oeeData.summary.totalBookedHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Booked Hours</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatMetric(topActivity.oee24_7.oee)}
            </div>
            <p className="text-xs text-muted-foreground">Top OEE ({topActivity.activityType})</p>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Activity Performance (24/7 OEE)</h4>
          <div className="grid grid-cols-2 gap-2">
            {oeeData.activityOEE.slice(0, 4).map((activity) => (
              <div key={activity.activityType} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{activity.activityType}:</span>
                <Badge variant={getOEEBadgeVariant(activity.oee24_7.oee)} className="text-xs">
                  {activity.actualRate > activity.target247Rate ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatMetric(activity.oee24_7.oee)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t">
          <Link to={oeeUrl}>
            <Button className="w-full gap-2">
              View Detailed OEE Analysis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
