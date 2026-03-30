import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

interface OEEBarComparisonProps {
  data: OEETimeSeriesData[];
  className?: string;
}

const ACTIVITY_COLORS = {
  'Laser1': '#3b82f6',
  'Laser2': '#10b981',
  'Laser3': '#f59e0b',
  'Welder': '#ef4444',
  'Other': '#8b5cf6',
};

const getOEEColor = (value: number) => {
  if (value >= 85) return '#22c55e'; // Green
  if (value >= 70) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

export const OEEBarComparison = ({ data, className }: OEEBarComparisonProps) => {
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

  const chartData = Object.values(activityAverages).map((item: any) => {
    const oee247 = Number((item.oee_247_sum / item.count).toFixed(1));
    const oeeBooked = Number((item.oee_booked_sum / item.count).toFixed(1));
    
    return {
      activity: item.activity,
      'OEE 24/7': oee247,
      'OEE Booked': oeeBooked,
      activityColor: ACTIVITY_COLORS[item.activity as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Other,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">OEE Comparison by Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Side-by-side comparison of 24/7 vs Booked Time OEE
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="activity" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="OEE 24/7" 
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                name="OEE 24/7"
              />
              <Bar 
                dataKey="OEE Booked" 
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                name="OEE Booked"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>OEE 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>OEE Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};