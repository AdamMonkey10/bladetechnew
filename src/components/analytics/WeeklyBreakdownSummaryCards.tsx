import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Cpu, Package, TrendingUp, TrendingDown, Clock, Gauge } from 'lucide-react';
import { PreviousWeekSummary } from '@/hooks/useWeeklyBreakdown';

interface SummaryData {
  totalProduction: number;
  totalRuntime: number;
  operatorsWorked: number;
  machinesUtilized: number;
  skusProduced: number;
  overallEfficiency: number;
}

interface WeeklyBreakdownSummaryCardsProps {
  summary: SummaryData;
  previousWeekSummary?: PreviousWeekSummary | null;
  totalOperators?: number;
  totalMachines?: number;
}

function WoWDelta({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return null;

  const isUp = change > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
      <Icon className="h-3 w-3" />
      <span>{isUp ? '+' : ''}{change.toFixed(0)}%{suffix}</span>
    </div>
  );
}

export function WeeklyBreakdownSummaryCards({ summary, previousWeekSummary, totalOperators, totalMachines }: WeeklyBreakdownSummaryCardsProps) {
  const overallRate = summary.totalRuntime > 0 
    ? Math.round(summary.totalProduction / summary.totalRuntime) 
    : 0;
  const prevRate = previousWeekSummary && previousWeekSummary.totalRuntime > 0
    ? previousWeekSummary.totalProduction / previousWeekSummary.totalRuntime
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Production</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalProduction.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">blades produced</p>
            {previousWeekSummary && <WoWDelta current={summary.totalProduction} previous={previousWeekSummary.totalProduction} suffix=" vs last wk" />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalRuntime.toFixed(1)}h</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">runtime logged</p>
            {previousWeekSummary && <WoWDelta current={summary.totalRuntime} previous={previousWeekSummary.totalRuntime} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallRate}/h</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">average rate</p>
            {prevRate > 0 && <WoWDelta current={overallRate} previous={prevRate} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.overallEfficiency.toFixed(1)}%</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">overall efficiency</p>
            {previousWeekSummary && <WoWDelta current={summary.overallEfficiency} previous={previousWeekSummary.overallEfficiency} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.operatorsWorked}</div>
          <p className="text-xs text-muted-foreground">
            {totalOperators ? `of ${totalOperators} operators` : 'employees worked'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Machines Used</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.machinesUtilized}</div>
          <p className="text-xs text-muted-foreground">
            {totalMachines ? `of ${totalMachines} available` : 'machines utilized'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
