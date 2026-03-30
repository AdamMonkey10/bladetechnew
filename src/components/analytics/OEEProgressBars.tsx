import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

interface OEEProgressBarsProps {
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

const getOEEColorClass = (value: number) => {
  if (value >= 85) return 'text-green-600';
  if (value >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

const getProgressColorClass = (value: number) => {
  if (value >= 85) return 'bg-green-500';
  if (value >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const OEEProgressBars = ({ data, className }: OEEProgressBarsProps) => {
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
    activityColor: ACTIVITY_COLORS[item.activity as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Other,
  }));

  const ActivityProgressCard = ({ activity, oee_247, oee_booked, availability_247, performance_247, availability_booked, performance_booked, quality, activityColor }: any) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: activityColor }}
          />
          <CardTitle className="text-lg">{activity}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OEE Metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">OEE 24/7</span>
              <span className={`text-sm font-bold ${getOEEColorClass(oee_247)}`}>
                {oee_247}%
              </span>
            </div>
            <Progress value={oee_247} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">OEE Booked</span>
              <span className={`text-sm font-bold ${getOEEColorClass(oee_booked)}`}>
                {oee_booked}%
              </span>
            </div>
            <Progress value={oee_booked} className="h-2" />
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Component Breakdown
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Availability (24/7):</span>
              <span className="font-medium">{availability_247}%</span>
            </div>
            <div className="flex justify-between">
              <span>Performance (24/7):</span>
              <span className="font-medium">{performance_247}%</span>
            </div>
            <div className="flex justify-between">
              <span>Availability (Booked):</span>
              <span className="font-medium">{availability_booked}%</span>
            </div>
            <div className="flex justify-between">
              <span>Performance (Booked):</span>
              <span className="font-medium">{performance_booked}%</span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className="font-medium">{quality}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">OEE Performance Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Progress bars showing OEE performance and component breakdown by activity
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityData.map((item) => (
            <ActivityProgressCard
              key={item.activity}
              {...item}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};