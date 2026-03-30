import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface OEEDualGaugeChartProps {
  data: OEETimeSeriesData[];
  className?: string;
}

const ACTIVITY_COLORS = {
  'Laser1': 'hsl(220, 91%, 60%)', // #3b82f6
  'Laser2': 'hsl(160, 84%, 39%)', // #10b981
  'Laser3': 'hsl(38, 92%, 50%)',  // #f59e0b
  'Welder': 'hsl(0, 84%, 60%)',   // #ef4444
  'Other': 'hsl(248, 53%, 58%)',  // #8b5cf6
};

const getOEEColor = (value: number) => {
  if (value >= 85) return 'hsl(142, 76%, 36%)'; // Green
  if (value >= 70) return 'hsl(48, 96%, 53%)';  // Yellow
  return 'hsl(0, 84%, 60%)'; // Red
};

export const OEEDualGaugeChart = ({ data, className }: OEEDualGaugeChartProps) => {
  // Calculate average OEE by activity type
  const activityAverages = data.reduce((acc, item) => {
    if (!acc[item.activity_type]) {
      acc[item.activity_type] = {
        activity: item.activity_type,
        oee_247_sum: 0,
        oee_booked_sum: 0,
        count: 0,
      };
    }
    
    acc[item.activity_type].oee_247_sum += item.oee_247;
    acc[item.activity_type].oee_booked_sum += item.oee_booked;
    acc[item.activity_type].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const activityData = Object.values(activityAverages).map((item: any) => {
    const oee247 = Number((item.oee_247_sum / item.count).toFixed(1));
    const oeeBooked = Number((item.oee_booked_sum / item.count).toFixed(1));
    
    return {
      activity: item.activity,
      oee_247: oee247,
      oee_booked: oeeBooked,
      activityColor: ACTIVITY_COLORS[item.activity as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Other,
    };
  });

  const ActivityGauge = ({ activity, oee_247, oee_booked, activityColor }: any) => {
    // Generate scale marks for 0%, 25%, 50%, 75%, 100%
    const scaleMarks = [0, 25, 50, 75, 100];
    
    const getScalePosition = (value: number, centerX: number, centerY: number) => {
      // Convert percentage to angle (90° to -270° range)
      const angleRange = 360;
      const angle = 90 - (value / 100) * angleRange;
      const radians = (angle * Math.PI) / 180;
      const radius = 100; // Position outside the gauge
      
      return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians),
      };
    };

    return (
      <Card className="text-center">
        <CardContent className="p-4">
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="80%"
                startAngle={90}
                endAngle={-270}
                data={[
                  { 
                    name: 'oee_247', 
                    value: Math.min(Math.max(oee_247 || 0, 0), 100), 
                    fill: activityColor, 
                    innerRadius: '65%', 
                    outerRadius: '80%' 
                  },
                  { 
                    name: 'oee_booked', 
                    value: Math.min(Math.max(oee_booked || 0, 0), 100), 
                    fill: getOEEColor(oee_booked), 
                    innerRadius: '45%', 
                    outerRadius: '60%' 
                  }
                ]}
              >
                <RadialBar dataKey="value" cornerRadius={2} />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Scale marks */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
              {scaleMarks.map((mark) => {
                const pos = getScalePosition(mark, 128, 128);
                return (
                  <g key={mark}>
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-xs font-medium"
                    >
                      {mark}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Text content moved outside */}
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-lg text-foreground mb-2">{activity}</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: activityColor }}
                />
                <span className="text-muted-foreground">24/7:</span>
                <span className="font-medium">{oee_247}%</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getOEEColor(oee_booked) }}
                />
                <span className="text-muted-foreground">Booked:</span>
                <span className="font-medium">{oee_booked}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Average OEE Comparison by Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Concentric gauges showing 24/7 OEE (outer) vs Booked Time OEE (inner)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityData.map((item) => (
            <ActivityGauge
              key={item.activity}
              activity={item.activity}
              oee_247={item.oee_247}
              oee_booked={item.oee_booked}
              activityColor={item.activityColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};