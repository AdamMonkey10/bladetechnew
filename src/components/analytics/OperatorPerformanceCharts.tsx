import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';

interface OperatorPerformance {
  operatorName: string;
  operatorCode: string;
  activities: Record<string, {
    totalUnits: number;
    totalTime: number;
    totalScrap: number;
    efficiency: number;
    scrapRate: number;
    shifts: number;
  }>;
  totalShifts: number;
  overallEfficiency: number;
  overallScrapRate: number;
  hoursBooked: number;
  hoursWorked: number;
  attendanceRate: number;
}

interface OperatorPerformanceChartsProps {
  operators: OperatorPerformance[];
  activities: string[];
}

export function OperatorPerformanceCharts({ operators, activities }: OperatorPerformanceChartsProps) {
  // Prepare data for productivity chart
  const productivityData = operators.map(op => ({
    operator: op.operatorCode,
    name: op.operatorName,
    efficiency: Number(op.overallEfficiency.toFixed(1)),
    ...activities.reduce((acc, activity) => ({
      ...acc,
      [activity]: Number((op.activities[activity]?.efficiency || 0).toFixed(1))
    }), {})
  }));

  // Prepare data for quality chart
  const qualityData = operators.map(op => ({
    operator: op.operatorCode,
    name: op.operatorName,
    scrapRate: Number(op.overallScrapRate.toFixed(1)),
    ...activities.reduce((acc, activity) => ({
      ...acc,
      [`${activity}_scrap`]: Number((op.activities[activity]?.scrapRate || 0).toFixed(1))
    }), {})
  }));

  const productivityConfig: ChartConfig = {
    efficiency: {
      label: "Overall Efficiency (u/h)",
      color: "hsl(var(--primary))",
    },
    ...activities.reduce((acc, activity) => ({
      ...acc,
      [activity]: {
        label: `${activity} (u/h)`,
        color: `hsl(${200 + activities.indexOf(activity) * 30}, 70%, 50%)`,
      }
    }), {})
  };

  const qualityConfig: ChartConfig = {
    scrapRate: {
      label: "Overall Scrap Rate (%)",
      color: "hsl(var(--destructive))",
    },
    ...activities.reduce((acc, activity) => ({
      ...acc,
      [`${activity}_scrap`]: {
        label: `${activity} Scrap (%)`,
        color: `hsl(${10 + activities.indexOf(activity) * 15}, 70%, 50%)`,
      }
    }), {})
  };

  // Prepare data for hours comparison chart
  const hoursData = operators.map(op => ({
    operator: op.operatorCode,
    name: op.operatorName,
    hoursBooked: Number(op.hoursBooked.toFixed(1)),
    hoursWorked: Number(op.hoursWorked.toFixed(1)),
    attendanceRate: Number(op.attendanceRate.toFixed(1))
  }));

  const hoursConfig: ChartConfig = {
    hoursBooked: {
      label: "Hours Booked",
      color: "hsl(var(--primary))",
    },
    hoursWorked: {
      label: "Hours Worked", 
      color: "hsl(var(--destructive))",
    },
    attendanceRate: {
      label: "Attendance Rate (%)",
      color: "hsl(var(--accent))",
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Productivity Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">
            Units per hour by operator and activity
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={productivityConfig} className="h-[400px]">
            <BarChart data={productivityData}>
              <XAxis 
                dataKey="operator" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `Operator: ${value}`}
              />
              <Bar 
                dataKey="efficiency" 
                fill="var(--color-efficiency)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Scrap rate percentage by operator
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={qualityConfig} className="h-[400px]">
            <LineChart data={qualityData}>
              <XAxis 
                dataKey="operator" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `Operator: ${value}`}
              />
              <Line 
                type="monotone" 
                dataKey="scrapRate" 
                stroke="var(--color-scrapRate)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Hours Booked vs Worked</CardTitle>
          <p className="text-sm text-muted-foreground">
            Scheduled hours vs actual hours worked by operator
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={hoursConfig} className="h-[400px]">
            <BarChart data={hoursData}>
              <XAxis 
                dataKey="operator" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `Operator: ${value}`}
              />
              <Bar 
                dataKey="hoursBooked" 
                fill="var(--color-hoursBooked)"
                radius={[2, 2, 0, 0]}
                name="Hours Booked"
              />
              <Bar 
                dataKey="hoursWorked" 
                fill="var(--color-hoursWorked)"
                radius={[2, 2, 0, 0]}
                name="Hours Worked"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}