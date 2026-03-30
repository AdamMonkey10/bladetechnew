
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

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

interface OEETimeSeriesChartProps {
  data: OEETimeSeriesData[];
  metric: 'oee_247' | 'oee_booked' | 'availability_247' | 'performance_247' | 'performance_booked' | 'quality';
  title: string;
  className?: string;
}

const ACTIVITY_COLORS = {
  'Laser1': '#3b82f6',
  'Laser2': '#10b981',
  'Laser3': '#f59e0b',
  'Welder': '#ef4444',
  'Other': '#8b5cf6',
};

export const OEETimeSeriesChart = ({ data, metric, title, className }: OEETimeSeriesChartProps) => {
  // Group data by activity type for multiple lines
  const activityTypes = Array.from(new Set(data.map(d => d.activity_type)));
  
  // Transform data for chart - group by date with all activities
  const chartData = data.reduce((acc, item) => {
    const existingDate = acc.find(d => d.date === item.date);
    if (existingDate) {
      existingDate[item.activity_type] = item[metric];
    } else {
      acc.push({
        date: item.date,
        [item.activity_type]: item[metric],
      });
    }
    return acc;
  }, [] as any[]);

  const formatTooltipValue = (value: number, name: string) => {
    const unit = metric.includes('oee') || metric === 'quality' || metric.includes('performance') || metric.includes('availability') ? '%' : '';
    return [`${value.toFixed(1)}${unit}`, name];
  };

  const formatXAxisLabel = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Date: ${formatXAxisLabel(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              {activityTypes.map((activityType) => (
                <Line
                  key={activityType}
                  type="monotone"
                  dataKey={activityType}
                  stroke={ACTIVITY_COLORS[activityType as keyof typeof ACTIVITY_COLORS] || '#6b7280'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
