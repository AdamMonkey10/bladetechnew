import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useWeeklyBreakdown } from '@/hooks/useWeeklyBreakdown';
import { 
  Calendar as CalendarIcon,
  Download,
  Loader2,
  Settings,
  Users,
  Package,
  Clock,
  TrendingUp,
  Cpu,
  BarChart3
} from 'lucide-react';
import { format, startOfWeek, subWeeks, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function WeeklyBreakdown() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const { data: weeklyData, isLoading, error } = useWeeklyBreakdown({
    weekStartDate: selectedWeek,
  });

  const handleExport = () => {
    if (!weeklyData) return;

    try {
      // Summary CSV data
      const summaryData = [
        ['WEEKLY PRODUCTION BREAKDOWN REPORT'],
        [`Week: ${weeklyData.weekStart} to ${weeklyData.weekEnd}`],
        [''],
        ['SUMMARY METRICS'],
        ['Total Production', weeklyData.summary.totalProduction.toLocaleString()],
        ['Total Runtime (hrs)', weeklyData.summary.totalRuntime.toFixed(1)],
        ['Operators Worked', weeklyData.summary.operatorsWorked.toString()],
        ['Machines Utilized', weeklyData.summary.machinesUtilized.toString()],
        ['SKUs Produced', weeklyData.summary.skusProduced.toString()],
        ['Average Efficiency (%)', weeklyData.summary.overallEfficiency.toFixed(1)],
        [''],
        ['OPERATOR SUMMARY'],
        ['Operator', 'Code', 'Total Units', 'Runtime (hrs)', 'Rate (units/hr)', 'Efficiency (%)', 'Machines'],
        ...weeklyData.operators.map(op => [
          op.operatorName,
          op.operatorCode,
          op.totalUnits.toString(),
          op.totalRuntime.toFixed(1),
          (op.totalRuntime > 0 ? op.totalUnits / op.totalRuntime : 0).toFixed(1),
          op.averageEfficiency.toFixed(1),
          op.machines.join('; ')
        ]),
        [''],
        ['MACHINE SUMMARY'],
        ['Machine', 'Total Units', 'Runtime (hrs)', 'Rate (units/hr)', 'Efficiency (%)', 'Utilization (%)'],
        ...weeklyData.machines.map(machine => [
          machine.machine,
          machine.totalUnits.toString(),
          machine.totalRuntime.toFixed(1),
          (machine.totalRuntime > 0 ? machine.totalUnits / machine.totalRuntime : 0).toFixed(1),
          machine.efficiency.toFixed(1),
          machine.utilization.toFixed(1)
        ]),
        [''],
        ['DETAILED RECORDS'],
        ['Date', 'Shift', 'SKU', 'Units', 'Runtime (hrs)', 'Scrap', 'Rate (units/hr)', 'Efficiency (%)'],
        ...weeklyData.detailedRecords.map(record => [
          record.date,
          record.shiftType,
          record.sku,
          record.units.toString(),
          record.runtime.toFixed(2),
          record.scrap.toString(),
          record.rate.toFixed(2),
          record.efficiency.toFixed(1),
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([summaryData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-breakdown-${weeklyData.weekStart}-to-${weeklyData.weekEnd}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Weekly breakdown data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export weekly breakdown data",
        variant: "destructive",
      });
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return "text-green-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 85) return { variant: "default" as const, label: "Excellent" };
    if (efficiency >= 70) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Poor" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading weekly breakdown...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading weekly breakdown data</p>
        </CardContent>
      </Card>
    );
  }

  if (!weeklyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No data available for the selected week</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Weekly Production Breakdown</h2>
          <p className="text-muted-foreground">
            Week of {format(new Date(weeklyData.weekStart), 'MMM dd')} - {format(new Date(weeklyData.weekEnd), 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Select Week
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={(date) => {
                  if (date) {
                    setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 }));
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Production</p>
                <p className="text-xl font-semibold">{weeklyData.summary.totalProduction.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Operators</p>
                <p className="text-xl font-semibold">{weeklyData.summary.operatorsWorked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Machines</p>
                <p className="text-xl font-semibold">{weeklyData.summary.machinesUtilized}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">SKUs</p>
                <p className="text-xl font-semibold">{weeklyData.summary.skusProduced}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className={`text-xl font-semibold ${getEfficiencyColor(weeklyData.summary.overallEfficiency)}`}>
                  {weeklyData.summary.overallEfficiency.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Records</TabsTrigger>
        </TabsList>

        <TabsContent value="machines" className="space-y-4">
          {weeklyData.machines.map((machine) => (
            <Card key={machine.machine}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{machine.machine}</CardTitle>
                     <div className="flex gap-4 mt-2">
                       <span className="text-sm text-muted-foreground">
                         Runtime: {machine.totalRuntime.toFixed(1)}h
                       </span>
                       <span className="text-sm text-muted-foreground">
                         Units: {machine.totalUnits.toLocaleString()}
                       </span>
                       <span className="text-sm font-medium text-primary">
                         Rate: {machine.totalRuntime > 0 ? (machine.totalUnits / machine.totalRuntime).toFixed(1) : '0'} units/hr
                       </span>
                       <span className="text-sm text-muted-foreground">
                         Scrap: {machine.totalScrap}
                       </span>
                     </div>
                  </div>
                  <div className="text-right">
                    <Badge {...getEfficiencyBadge(machine.efficiency)}>
                      {machine.efficiency.toFixed(1)}% Efficiency
                    </Badge>
                    <div className="mt-2">
                      <Progress value={machine.utilization} className="w-24" />
                      <span className="text-xs text-muted-foreground">
                        {machine.utilization.toFixed(1)}% Utilization
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="operators" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="operators">Operators ({machine.operators.length})</TabsTrigger>
                    <TabsTrigger value="skus">SKUs ({machine.skus.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="operators">
                    <div className="space-y-3">
                      {machine.operators.map((operator, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{operator.operatorName}</p>
                              <p className="text-sm text-muted-foreground">Code: {operator.operatorCode}</p>
                            </div>
                             <div className="text-right">
                               <p className="text-sm font-medium">
                                 {operator.units.toLocaleString()} units in {operator.runtime.toFixed(1)}h
                               </p>
                               <p className="text-sm text-muted-foreground">
                                 Rate: {operator.runtime > 0 ? (operator.units / operator.runtime).toFixed(1) : '0'} units/hr
                               </p>
                               <Badge {...getEfficiencyBadge(operator.efficiency)}>
                                 {operator.efficiency.toFixed(1)}%
                               </Badge>
                             </div>
                          </div>
                          {operator.shifts.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {operator.shifts.length} shift{operator.shifts.length > 1 ? 's' : ''} worked
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="skus">
                    <div className="space-y-3">
                      {machine.skus.map((sku, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{sku.sku}</p>
                              <p className="text-sm text-muted-foreground">
                                Rate: {sku.rate.toFixed(1)} units/hour
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                {sku.units.toLocaleString()} units
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {sku.runtime.toFixed(1)}h runtime
                              </p>
                              {sku.scrap > 0 && (
                                <p className="text-xs text-destructive">
                                  {sku.scrap} scrap
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          {weeklyData.operators.map((operator) => (
            <Card key={`${operator.operatorName}_${operator.operatorCode}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{operator.operatorName}</CardTitle>
                    <p className="text-sm text-muted-foreground">Code: {operator.operatorCode}</p>
                     <div className="flex gap-4 mt-2">
                       <span className="text-sm text-muted-foreground">
                         Runtime: {operator.totalRuntime.toFixed(1)}h
                       </span>
                       <span className="text-sm text-muted-foreground">
                         Units: {operator.totalUnits.toLocaleString()}
                       </span>
                       <span className="text-sm font-medium text-primary">
                         Rate: {operator.totalRuntime > 0 ? (operator.totalUnits / operator.totalRuntime).toFixed(1) : '0'} units/hr
                       </span>
                       <span className="text-sm text-muted-foreground">
                         Machines: {operator.machines.join(', ')}
                       </span>
                     </div>
                  </div>
                  <div className="text-right">
                    <Badge {...getEfficiencyBadge(operator.averageEfficiency)}>
                      {operator.averageEfficiency.toFixed(1)}% Avg Efficiency
                    </Badge>
                    {operator.totalScrap > 0 && (
                      <p className="text-sm text-destructive mt-1">
                        {operator.totalScrap} scrap units
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Machine Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(operator.machineBreakdown).map(([machine, machineData]) => (
                        <div key={machine} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center">
                            <div>
                               <p className="font-medium">{machine}</p>
                               <p className="text-sm text-muted-foreground">
                                 {machineData.units.toLocaleString()} units in {machineData.runtime.toFixed(1)}h
                               </p>
                               <p className="text-sm font-medium text-primary">
                                 Rate: {machineData.runtime > 0 ? (machineData.units / machineData.runtime).toFixed(1) : '0'} units/hr
                               </p>
                            </div>
                            <div className="text-right">
                              <Badge {...getEfficiencyBadge(machineData.efficiency)}>
                                {machineData.efficiency.toFixed(1)}%
                              </Badge>
                              {machineData.scrap > 0 && (
                                <p className="text-sm text-destructive">
                                  {machineData.scrap} scrap
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Daily Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(operator.dailyBreakdown).map(([date, dayData]) => (
                        <div key={date} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{format(new Date(date), 'MMM dd, yyyy')}</p>
                              <p className="text-sm text-muted-foreground">
                                Shifts: {dayData.shifts.join(', ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                {dayData.totalUnits.toLocaleString()} units in {dayData.totalRuntime.toFixed(1)}h
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Machines: {dayData.machines.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Production Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Runtime (h)</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Scrap</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {weeklyData.detailedRecords.length > 0 ? (
                    weeklyData.detailedRecords.map((record, idx) => (
                      <TableRow key={`${record.date}-${record.shiftType}-${record.sku}-${idx}`}>
                        <TableCell>{format(new Date(record.date), 'MMM dd')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.shiftType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.sku}</TableCell>
                        <TableCell className="text-right">{record.units.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{record.runtime.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{record.rate.toFixed(1)}/h</TableCell>
                        <TableCell className="text-right">
                          {record.scrap > 0 ? (
                            <span className="text-destructive">{record.scrap}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getEfficiencyColor(record.efficiency)}>
                            {record.efficiency.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No production data available for this week
                      </TableCell>
                    </TableRow>
                  )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}