
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

interface OEEComparisonChartProps {
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

export const OEEComparisonChart = ({ data, className }: OEEComparisonChartProps) => {
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

  const chartData = Object.values(activityAverages).map((item: any) => ({
    activity: item.activity,
    'OEE 24/7': Number((item.oee_247_sum / item.count).toFixed(1)),
    'OEE Booked': Number((item.oee_booked_sum / item.count).toFixed(1)),
  }));

  const formatTooltipValue = (value: number, name: string) => {
    return [`${value}%`, name];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Average OEE Comparison by Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing 24/7 OEE vs Booked Time OEE across activities
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="activity" />
              <YAxis 
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="OEE 24/7" 
                fill="#3b82f6" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="OEE Booked" 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
