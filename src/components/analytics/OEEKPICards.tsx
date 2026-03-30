import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OEETimeSeriesData {
  date: string;
  activity_type: string;
  oee_247: number;
  oee_booked: number;
  availability_247: number;
  performance_247: number;
  availability_booked: number;
  performance_booked: number;
  quality: number;
  total_units: number;
  total_time: number;
  booked_hours: number;
}

interface OEEKPICardsProps {
  data: OEETimeSeriesData[];
  className?: string;
}

const ACTIVITY_COLORS = {
  'Laser1': 'hsl(220, 91%, 60%)',
  'Laser2': 'hsl(160, 84%, 39%)', 
  'Laser3': 'hsl(38, 92%, 50%)',
  'Welder': 'hsl(0, 84%, 60%)',
  'Other': 'hsl(248, 53%, 58%)',
};

const getPerformanceBadge = (value: number) => {
  if (value >= 85) return { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200', label: 'Excellent' };
  if (value >= 70) return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Good' };
  return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 border-red-200', label: 'Needs Improvement' };
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-600" />;
};

export const OEEKPICards = ({ data, className }: OEEKPICardsProps) => {
  // Calculate average OEE by activity type
  const activityAverages = data.reduce((acc, item) => {
    if (!acc[item.activity_type]) {
      acc[item.activity_type] = {
        activity: item.activity_type,
        oee_247_sum: 0,
        oee_booked_sum: 0,
        availability_247_sum: 0,
        performance_247_sum: 0,
        availability_booked_sum: 0,
        performance_booked_sum: 0,
        quality_sum: 0,
        units_sum: 0,
        time_sum: 0,
        count: 0,
      };
    }
    
    acc[item.activity_type].oee_247_sum += item.oee_247;
    acc[item.activity_type].oee_booked_sum += item.oee_booked;
    acc[item.activity_type].availability_247_sum += item.availability_247;
    acc[item.activity_type].performance_247_sum += item.performance_247;
    acc[item.activity_type].availability_booked_sum += item.availability_booked;
    acc[item.activity_type].performance_booked_sum += item.performance_booked;
    acc[item.activity_type].quality_sum += item.quality;
    acc[item.activity_type].units_sum += item.total_units;
    acc[item.activity_type].time_sum += item.total_time;
    acc[item.activity_type].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const activityData = Object.values(activityAverages).map((item: any) => ({
    activity: item.activity,
    oee_247: Number((item.oee_247_sum / item.count).toFixed(1)),
    oee_booked: Number((item.oee_booked_sum / item.count).toFixed(1)),
    availability_247: Number((item.availability_247_sum / item.count).toFixed(1)),
    performance_247: Number((item.performance_247_sum / item.count).toFixed(1)),
    availability_booked: Number((item.availability_booked_sum / item.count).toFixed(1)),
    performance_booked: Number((item.performance_booked_sum / item.count).toFixed(1)),
    quality: Number((item.quality_sum / item.count).toFixed(1)),
    totalUnits: item.units_sum,
    totalTime: Number((item.time_sum / 60).toFixed(1)), // Convert to hours
    activityColor: ACTIVITY_COLORS[item.activity as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Other,
  }));

  const ActivityKPICard = ({ activity, oee_247, oee_booked, availability_247, performance_247, quality, totalUnits, totalTime, activityColor }: any) => {
    const oee247Badge = getPerformanceBadge(oee_247);
    const oeeBookedBadge = getPerformanceBadge(oee_booked);
    
    return (
      <Card className="relative overflow-hidden">
        {/* Activity Color Strip */}
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ backgroundColor: activityColor }}
        />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{activity}</CardTitle>
            <Badge className={oee247Badge.color}>
              {oee247Badge.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{oee_247}%</div>
              <div className="text-xs text-muted-foreground">OEE 24/7</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{oee_booked}%</div>
              <div className="text-xs text-muted-foreground">OEE Booked</div>
            </div>
          </div>
          
          {/* Component Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold text-lg">{availability_247}%</div>
              <div className="text-muted-foreground">Availability</div>
            </div>
            <div>
              <div className="font-semibold text-lg">{performance_247}%</div>
              <div className="text-muted-foreground">Performance</div>
            </div>
            <div>
              <div className="font-semibold text-lg">{quality}%</div>
              <div className="text-muted-foreground">Quality</div>
            </div>
          </div>
          
          {/* Production Summary */}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Units:</span>
              <span className="font-medium">{totalUnits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Time:</span>
              <span className="font-medium">{totalTime}h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">OEE Performance Dashboard</CardTitle>
        <p className="text-sm text-muted-foreground">
          Key performance indicators and metrics by activity
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityData.map((item) => (
            <ActivityKPICard
              key={item.activity}
              {...item}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};