import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWeeklyBreakdown } from '@/hooks/useWeeklyBreakdown';
import { WeekSelector } from '@/components/analytics/WeekSelector';
import { Loader2, TrendingUp, Users, Cpu } from 'lucide-react';
import { subWeeks } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProductionCharts() {
  const [selectedWeek, setSelectedWeek] = useState(subWeeks(new Date(), 1));
  const [isSingleDay, setIsSingleDay] = useState(false);
  
  const { data, isLoading } = useWeeklyBreakdown({
    weekStartDate: selectedWeek,
    singleDay: isSingleDay,
  });

  // Prepare machine chart data
  const machineChartData = data?.machines.map(m => ({
    name: m.machine,
    units: m.totalUnits,
    hours: m.totalRuntime,
    rate: m.totalRuntime > 0 ? (m.totalUnits / m.totalRuntime).toFixed(0) : 0,
  })) || [];

  // Prepare employee chart data
  const employeeChartData = data?.operators.map(e => ({
    name: e.operatorName,
    units: e.totalUnits,
    hours: e.totalRuntime,
    rate: e.totalRuntime > 0 ? (e.totalUnits / e.totalRuntime).toFixed(0) : 0,
  })) || [];

  // Prepare SKU chart data (aggregate from machines)
  const aggregateSKUs = () => {
    if (!data?.machines) return [];
    
    const skuMap = new Map<string, { sku: string; totalUnits: number; totalRuntime: number }>();

    data.machines.forEach((machine) => {
      machine.skus?.forEach((sku) => {
        const existing = skuMap.get(sku.sku) || { sku: sku.sku, totalUnits: 0, totalRuntime: 0 };
        existing.totalUnits += sku.units;
        existing.totalRuntime += sku.runtime;
        skuMap.set(sku.sku, existing);
      });
    });

    return Array.from(skuMap.values())
      .map((sku) => ({
        name: sku.sku,
        units: sku.totalUnits,
        hours: sku.totalRuntime,
        rate: sku.totalRuntime > 0 ? (sku.totalUnits / sku.totalRuntime).toFixed(0) : 0,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 10); // Top 10 SKUs
  };

  const skuChartData = aggregateSKUs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading production charts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Production Charts</h1>
          <p className="text-muted-foreground">Visual analysis of production data</p>
        </div>
        
        <WeekSelector
          selectedWeek={selectedWeek}
          onWeekChange={(date, singleDay) => {
            setSelectedWeek(date);
            if (singleDay !== undefined) setIsSingleDay(singleDay);
          }}
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="machines" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="machines" className="gap-2">
            <Cpu className="h-4 w-4" />
            Machines
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="skus" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            SKUs
          </TabsTrigger>
        </TabsList>

        {/* Machines Charts */}
        <TabsContent value="machines" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Machine Production (Units)</CardTitle>
                <CardDescription>Total units produced by each machine</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machineChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="units" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Machine Hours</CardTitle>
                <CardDescription>Total hours worked by each machine</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machineChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="hours" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Machine Production Rate</CardTitle>
              <CardDescription>Units per hour for each machine</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={machineChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Rate (units/hr)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Charts */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Employee Production (Units)</CardTitle>
                <CardDescription>Total units produced by each employee</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeeChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="units" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employee Hours</CardTitle>
                <CardDescription>Total hours worked by each employee</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={employeeChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="hours" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Production Rate</CardTitle>
              <CardDescription>Units per hour for each employee</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={employeeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Rate (units/hr)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SKUs Charts */}
        <TabsContent value="skus" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top SKU Production (Units)</CardTitle>
                <CardDescription>Top 10 SKUs by units produced</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skuChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="units" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SKU Production Hours</CardTitle>
                <CardDescription>Total hours for top 10 SKUs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skuChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="hours" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SKU Production Rate</CardTitle>
              <CardDescription>Units per hour for top 10 SKUs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={skuChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Rate (units/hr)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
