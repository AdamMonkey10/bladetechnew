import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { startOfWeek, endOfWeek, format, subWeeks, eachWeekOfInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOEESettings } from '@/hooks/useOEESettings';

const MACHINE_MAPPING: Record<string, string> = {
  'Laser1': 'Laser1',
  'Laser2': 'Laser2', 
  'Laser3': 'Laser3',
  'Laser Machine 1': 'Laser1',
  'Laser Machine 2': 'Laser2',
  'Laser Machine 3': 'Laser3',
  'Welder': 'Welder',
  'Auto Welding': 'Auto Welding',
  'Coating': 'Coating',
  'Stacking': 'Stacking',
};

const formatMachineDisplay = (name: string): string => {
  const n = (name || '').trim();
  if (/^laser\s*1$/i.test(n) || /^laser1$/i.test(n)) return 'Laser 1';
  if (/^laser\s*2$/i.test(n) || /^laser2$/i.test(n)) return 'Laser 2';
  if (/^laser\s*3$/i.test(n) || /^laser3$/i.test(n)) return 'Laser 3';
  if (/auto\s*weld/i.test(n)) return 'Auto Welder';
  if (/welder/i.test(n)) return 'Welder';
  if (/coating/i.test(n)) return 'Coating';
  if (/stacking/i.test(n)) return 'Stacking';
  return n || 'Unknown';
};

const getMachineTargetRate = (machineName: string, targetRates: any): number => {
  const mapped = MACHINE_MAPPING[machineName];
  if (mapped && targetRates[mapped]) return targetRates[mapped];
  const l = machineName.toLowerCase();
  if (l.includes('laser')) return targetRates.Laser || 600;
  if (l.includes('weld')) return targetRates.Welder || 167;
  return 200;
};

type MetricView = 'units' | 'rate' | 'efficiency';

export function WeeklyTrendCharts() {
  const [weeksToShow, setWeeksToShow] = useState(8);
  const [selectedSKU, setSelectedSKU] = useState<string>('all');
  const [metricView, setMetricView] = useState<MetricView>('units');
  const { targetRates } = useOEESettings();

  const { data, isLoading } = useQuery({
    queryKey: ['weekly-trends', weeksToShow, targetRates],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subWeeks(endDate, weeksToShow);
      
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );

      const weeklyData = await Promise.all(
        weeks.map(async (weekDate) => {
          const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

          const { data: shiftData } = await supabase
            .from('shift_records')
            .select(`shift_date, shift_type, production_data, operators!inner(operator_name, operator_code)`)
            .gte('shift_date', format(weekStart, 'yyyy-MM-dd'))
            .lte('shift_date', format(weekEnd, 'yyyy-MM-dd'))
            .not('production_data', 'is', null);

          const machineStats = new Map<string, { units: number; hours: number; scrap: number }>();
          const skuData = new Map<string, { units: number; hours: number }>();
          let totalUnits = 0;
          let totalHours = 0;

          shiftData?.forEach((record: any) => {
            if (!record.production_data?.activities) return;
            const activities = record.production_data.activities;
            
            const processEntry = (activityType: string, entry: any) => {
              const units = parseInt(entry.units_produced) || 0;
              const timeSpent = parseFloat(entry.time_spent) || 0;
              const scrap = parseInt(entry.scrap || entry.Scrap) || 0;
              const sku = entry.sku || entry.SKU || 'Unknown';
              if (units <= 0 || sku === 'Unknown') return;

              totalUnits += units;
              totalHours += timeSpent;

              const rawMachine = MACHINE_MAPPING[activityType] || activityType;
              const existing = machineStats.get(rawMachine) || { units: 0, hours: 0, scrap: 0 };
              existing.units += units;
              existing.hours += timeSpent;
              existing.scrap += scrap;
              machineStats.set(rawMachine, existing);

              const skuEntry = skuData.get(sku) || { units: 0, hours: 0 };
              skuEntry.units += units;
              skuEntry.hours += timeSpent;
              skuData.set(sku, skuEntry);
            };

            if (Array.isArray(activities)) {
              activities.forEach((a: any) => a.entries?.forEach((e: any) => processEntry(a.name, e)));
            } else {
              Object.entries(activities).forEach(([t, arr]: [string, any]) => {
                if (Array.isArray(arr)) arr.forEach((e: any) => processEntry(t, e));
              });
            }
          });

          // Calculate efficiency
          let effSum = 0, effCount = 0;
          machineStats.forEach((stats, machine) => {
            if (stats.units > 0 && stats.hours > 0) {
              const goodUnits = stats.units - stats.scrap;
              const actualRate = goodUnits / stats.hours;
              const target = getMachineTargetRate(machine, targetRates);
              effSum += target > 0 ? (actualRate / target) * 100 : 0;
              effCount++;
            }
          });

          return {
            week: format(weekStart, 'MMM dd'),
            weekStart: format(weekStart, 'yyyy-MM-dd'),
            totalUnits,
            totalHours,
            rate: totalHours > 0 ? totalUnits / totalHours : 0,
            efficiency: effCount > 0 ? effSum / effCount : 0,
            skus: Array.from(skuData.entries()).map(([name, data]) => ({
              name, units: data.units, hours: data.hours,
              rate: data.hours > 0 ? data.units / data.hours : 0,
            })),
          };
        })
      );

      return weeklyData;
    },
    placeholderData: (prev) => prev, // Keep previous data while refetching
  });

  const allSKUs = Array.from(
    new Set(
      data?.flatMap(week => 
        week.skus?.map(s => s.name).filter(name => name && name !== 'Unknown') || []
      ) || []
    )
  ).sort();

  const chartData = data?.map(week => {
    if (selectedSKU === 'all') {
      return {
        week: week.week,
        units: week.totalUnits,
        rate: Math.round(week.rate),
        efficiency: Math.round(week.efficiency),
      };
    } else {
      const skuEntry = week.skus?.find(s => s.name === selectedSKU);
      return {
        week: week.week,
        units: skuEntry?.units || 0,
        rate: skuEntry ? Math.round(skuEntry.rate) : 0,
        efficiency: 0, // SKU-level efficiency not easily calculable
      };
    }
  }) || [];

  const metricConfig: Record<MetricView, { dataKey: string; name: string; color: string; yLabel: string }> = {
    units: { dataKey: 'units', name: 'Units Produced', color: 'hsl(var(--primary))', yLabel: 'Units' },
    rate: { dataKey: 'rate', name: 'Rate (units/hr)', color: 'hsl(var(--chart-3))', yLabel: 'Units/hr' },
    efficiency: { dataKey: 'efficiency', name: 'Efficiency %', color: 'hsl(var(--chart-2))', yLabel: 'Efficiency %' },
  };

  const activeMetric = metricConfig[metricView];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading weekly trends...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Weekly Production Trends</h2>
        <div className="flex flex-wrap gap-2">
          {/* Metric toggle */}
          <div className="flex rounded-md border border-input overflow-hidden">
            {(['units', 'rate', 'efficiency'] as MetricView[]).map(m => (
              <button
                key={m}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${metricView === m ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                onClick={() => setMetricView(m)}
              >
                {m === 'units' ? 'Units' : m === 'rate' ? 'Rate/hr' : 'Efficiency'}
              </button>
            ))}
          </div>

          <Select value={selectedSKU} onValueChange={setSelectedSKU}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select SKU" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All SKUs</SelectItem>
              {allSKUs.map(sku => (
                <SelectItem key={sku} value={sku}>{sku}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {[4, 8, 12, 52].map(w => (
            <Button key={w} variant={weeksToShow === w ? 'default' : 'outline'} size="sm" onClick={() => setWeeksToShow(w)}>
              {w === 52 ? '12 Months' : `${w} Weeks`}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeMetric.name} Over Time</CardTitle>
          <CardDescription>
            {selectedSKU === 'all' 
              ? `Weekly ${activeMetric.name.toLowerCase()} for all SKUs`
              : `Weekly ${activeMetric.name.toLowerCase()} for ${selectedSKU}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey={activeMetric.dataKey} stroke={activeMetric.color} strokeWidth={2} name={activeMetric.name} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
