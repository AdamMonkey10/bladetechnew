import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWeeklyBreakdown } from '@/hooks/useWeeklyBreakdown';

import { PerformanceIndicator } from './PerformanceIndicator';
import { 
  Calendar as CalendarIcon,
  Download,
  Loader2,
  Users,
  Package,
  Clock,
  TrendingUp,
  Cpu,
  BarChart3,
  FileText,
  Mail,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function WeeklyBreakdown() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Detailed records filters & sorting
  const [filterOperator, setFilterOperator] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterSKU, setFilterSKU] = useState<string>('all');
  const [detailSortKey, setDetailSortKey] = useState<string>('date');
  const [detailSortAsc, setDetailSortAsc] = useState(false);

  const { data: weeklyData, isLoading, error } = useWeeklyBreakdown({
    weekStartDate: selectedWeek,
  });

  const handleExport = () => {
    if (!weeklyData) return;

    try {
      const reportData = [
        ['WEEKLY PRODUCTION SUMMARY REPORT'],
        [`Week: ${weeklyData.weekStart} to ${weeklyData.weekEnd}`],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['EXECUTIVE SUMMARY'],
        ['Total Production', weeklyData.summary.totalProduction.toLocaleString()],
        ['Total Runtime', `${weeklyData.summary.totalRuntime.toFixed(1)} hours`],
        ['Average Efficiency', `${weeklyData.summary.overallEfficiency.toFixed(1)}%`],
        ['Operators Active', weeklyData.summary.operatorsWorked.toString()],
        ['Machines Utilized', weeklyData.summary.machinesUtilized.toString()],
        ['SKUs Produced', weeklyData.summary.skusProduced.toString()],
        [''],
        ['TOP PERFORMERS'],
        ['Rank', 'Operator', 'Efficiency %', 'Units Produced', 'Runtime Hours'],
        ...weeklyData.operators
          .sort((a, b) => b.averageEfficiency - a.averageEfficiency)
          .slice(0, 10)
          .map((op, idx) => [
            (idx + 1).toString(), op.operatorName, op.averageEfficiency.toFixed(1), op.totalUnits.toString(), op.totalRuntime.toFixed(1)
          ]),
        [''],
        ['MACHINE PERFORMANCE'],
        ['Machine', 'Efficiency %', 'Utilization %', 'Units Produced', 'Runtime Hours'],
        ...weeklyData.machines
          .sort((a, b) => b.efficiency - a.efficiency)
          .map(machine => [
            machine.machine, machine.efficiency.toFixed(1), machine.utilization.toFixed(1), machine.totalUnits.toString(), machine.totalRuntime.toFixed(1)
          ]),
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

      const blob = new Blob([reportData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `management-report-${weeklyData.weekStart}-to-${weeklyData.weekEnd}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Report exported successfully", description: "Management summary report downloaded" });
    } catch (error) {
      toast({ title: "Export failed", description: "Failed to export management report", variant: "destructive" });
    }
  };

  const getPerformanceStatus = (efficiency: number) => {
    if (efficiency >= 85) return { variant: "default" as const, label: "Excellent", color: "text-green-600" };
    if (efficiency >= 70) return { variant: "secondary" as const, label: "Good", color: "text-yellow-600" };
    return { variant: "destructive" as const, label: "Needs Attention", color: "text-red-600" };
  };

  // Compute unique filter values
  const filterOptions = useMemo(() => {
    if (!weeklyData) return { operators: [], machines: [], skus: [] };
    const ops = new Set<string>();
    const macs = new Set<string>();
    const skus = new Set<string>();
    weeklyData.detailedRecords.forEach(r => {
      ops.add(r.operatorName);
      macs.add(r.machine);
      skus.add(r.sku);
    });
    return {
      operators: Array.from(ops).sort(),
      machines: Array.from(macs).sort(),
      skus: Array.from(skus).sort(),
    };
  }, [weeklyData]);

  // Filtered & sorted detailed records
  const filteredRecords = useMemo(() => {
    if (!weeklyData) return [];
    let records = [...weeklyData.detailedRecords];
    if (filterOperator !== 'all') records = records.filter(r => r.operatorName === filterOperator);
    if (filterMachine !== 'all') records = records.filter(r => r.machine === filterMachine);
    if (filterSKU !== 'all') records = records.filter(r => r.sku === filterSKU);

    records.sort((a, b) => {
      let cmp = 0;
      switch (detailSortKey) {
        case 'date': cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'units': cmp = a.units - b.units; break;
        case 'runtime': cmp = a.runtime - b.runtime; break;
        case 'rate': cmp = a.rate - b.rate; break;
        case 'efficiency': cmp = a.efficiency - b.efficiency; break;
        default: cmp = 0;
      }
      return detailSortAsc ? cmp : -cmp;
    });

    return records.slice(0, 200);
  }, [weeklyData, filterOperator, filterMachine, filterSKU, detailSortKey, detailSortAsc]);

  const handleDetailSort = (key: string) => {
    if (detailSortKey === key) setDetailSortAsc(!detailSortAsc);
    else { setDetailSortKey(key); setDetailSortAsc(false); }
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
      <Card><CardContent className="p-6"><div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /><p>Error loading weekly breakdown data</p></div></CardContent></Card>
    );
  }

  if (!weeklyData) {
    return (
      <Card><CardContent className="p-6 text-center"><div className="flex flex-col items-center gap-2"><BarChart3 className="h-12 w-12 text-muted-foreground" /><p className="text-muted-foreground">No data available for the selected week</p></div></CardContent></Card>
    );
  }

  const prev = weeklyData.previousWeekSummary;

  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleDetailSort(field)}>
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Weekly Production Breakdown</h1>
          <p className="text-lg text-muted-foreground">
            Week of {format(new Date(weeklyData.weekStart), 'MMM dd')} - {format(new Date(weeklyData.weekEnd), 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline"><CalendarIcon className="h-4 w-4 mr-2" />Select Week</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={(date) => { if (date) { setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 })); setCalendarOpen(false); } }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleExport} variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button>
          <Button variant="outline"><Mail className="h-4 w-4 mr-2" />Email Report</Button>
        </div>
      </div>

      {/* KPI Cards with WoW comparison — no fake targets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card className="p-4">
          <PerformanceIndicator label="Total Production" value={weeklyData.summary.totalProduction} previousValue={prev?.totalProduction} type="number" />
          <Package className="h-5 w-5 text-primary mt-2" />
        </Card>
        
        <Card className="p-4">
          <PerformanceIndicator label="Overall Efficiency" value={weeklyData.summary.overallEfficiency} previousValue={prev?.overallEfficiency} type="percentage" />
          <TrendingUp className="h-5 w-5 text-primary mt-2" />
        </Card>
        
        <Card className="p-4">
          <PerformanceIndicator label="Active Operators" value={weeklyData.summary.operatorsWorked} previousValue={prev?.operatorsWorked} type="number" />
          <div className="text-xs text-muted-foreground mt-1">of {weeklyData.totalOperators} total</div>
          <Users className="h-5 w-5 text-primary mt-1" />
        </Card>
        
        <Card className="p-4">
          <PerformanceIndicator label="Machines Used" value={weeklyData.summary.machinesUtilized} previousValue={prev?.machinesUtilized} type="number" />
          <div className="text-xs text-muted-foreground mt-1">of {weeklyData.totalMachines} available</div>
          <Cpu className="h-5 w-5 text-primary mt-1" />
        </Card>
        
        <Card className="p-4">
          <PerformanceIndicator label="SKUs Produced" value={weeklyData.summary.skusProduced} type="number" />
          <BarChart3 className="h-5 w-5 text-primary mt-2" />
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Management Overview</TabsTrigger>
          <TabsTrigger value="operators">Operator Performance</TabsTrigger>
          <TabsTrigger value="machines">Machine Analysis</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operators with Rate per Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  All Operators - Rate per Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead className="text-right">Rate/Hour</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyData.operators
                      .sort((a, b) => b.averageEfficiency - a.averageEfficiency)
                      .map((operator) => {
                        const ratePerHour = operator.totalRuntime > 0 ? (operator.totalUnits / operator.totalRuntime) : 0;
                        return (
                          <TableRow key={`${operator.operatorName}_${operator.operatorCode}`}>
                            <TableCell className="font-medium">{operator.operatorName}</TableCell>
                            <TableCell className="text-right font-semibold">{ratePerHour.toFixed(1)} u/h</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* All Machines with Rate per Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  All Machines - Rate per Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate/Hour</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyData.machines
                      .filter(m => m.totalUnits > 0)
                      .sort((a, b) => {
                        const machineOrder = ['Laser 1', 'Laser 2', 'Laser 3', 'Auto Welder', 'Welder', 'Coating', 'Stacking'];
                        const aI = machineOrder.findIndex(m => m.toLowerCase().replace(/\s+/g, '') === a.machine.toLowerCase().replace(/\s+/g, ''));
                        const bI = machineOrder.findIndex(m => m.toLowerCase().replace(/\s+/g, '') === b.machine.toLowerCase().replace(/\s+/g, ''));
                        return (aI === -1 ? 999 : aI) - (bI === -1 ? 999 : bI);
                      })
                      .map((machine) => {
                        const ratePerHour = machine.totalRuntime > 0 ? (machine.totalUnits / machine.totalRuntime) : 0;
                        return (
                          <TableRow key={machine.machine}>
                            <TableCell className="font-medium">{machine.machine}</TableCell>
                            <TableCell className="text-right">{machine.totalRuntime.toFixed(1)}h</TableCell>
                            <TableCell className="text-right font-semibold">
                              {machine.totalRuntime > 0 ? `${ratePerHour.toFixed(1)} u/h` : '0 u/h'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>

                {/* SKU Production Summary */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      SKU Production Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Total Units</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">Rate/Hr</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const skuData = new Map();
                          weeklyData.machines.forEach(machine => {
                            machine.skus?.forEach(sku => {
                              const existing = skuData.get(sku.sku) || { sku: sku.sku, totalUnits: 0, totalRuntime: 0 };
                              existing.totalUnits += sku.units;
                              existing.totalRuntime += sku.runtime;
                              skuData.set(sku.sku, existing);
                            });
                          });
                          
                          return Array.from(skuData.values())
                            .filter(sku => sku.totalUnits > 0)
                            .sort((a, b) => b.totalUnits - a.totalUnits)
                            .map(sku => {
                              const ratePerHour = sku.totalRuntime > 0 ? (sku.totalUnits / sku.totalRuntime) : 0;
                              return (
                                <TableRow key={sku.sku}>
                                  <TableCell className="font-medium">{sku.sku}</TableCell>
                                  <TableCell className="text-right">{sku.totalUnits.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">{sku.totalRuntime.toFixed(1)}h</TableCell>
                                  <TableCell className="text-right font-semibold">{ratePerHour.toFixed(1)} u/h</TableCell>
                                </TableRow>
                              );
                            });
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Laser Machines Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Laser 1', 'Laser 2', 'Laser 3'].map((laserName, index) => {
              const laserNumber = index + 1;
              const laserMachine = weeklyData.machines.find(m => 
                m.machine === `Laser${laserNumber}` || m.machine === `Laser ${laserNumber}` ||
                m.machine.toLowerCase() === `laser${laserNumber}` || m.machine.toLowerCase() === `laser ${laserNumber}`
              );
              const ratePerHour = laserMachine && laserMachine.totalRuntime > 0 ? (laserMachine.totalUnits / laserMachine.totalRuntime) : 0;

              return (
                <Card key={laserName} className="border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-red-700">{laserName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{laserMachine ? `${laserMachine.totalRuntime.toFixed(1)}h` : '0h'}</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{laserMachine ? `${ratePerHour.toFixed(1)} u/h` : '0 u/h'}</div>
                      <div className="text-sm text-muted-foreground">Rate per Hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{laserMachine ? laserMachine.totalUnits.toLocaleString() : '0'}</div>
                      <div className="text-sm text-muted-foreground">Total Units</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Operator Performance Analysis</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-4">
                {weeklyData.operators
                  .sort((a, b) => b.averageEfficiency - a.averageEfficiency)
                  .map((operator) => (
                    <AccordionItem 
                      key={`${operator.operatorName}_${operator.operatorCode}`} 
                      value={`${operator.operatorName}_${operator.operatorCode}`}
                      className="border rounded-lg bg-gradient-to-r from-background to-muted/20"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-primary">{operator.operatorName}</h3>
                              <p className="text-muted-foreground">Code: {operator.operatorCode}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-lg font-semibold">{operator.totalUnits.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">Units</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold">{operator.totalRuntime.toFixed(1)}h</div>
                              <div className="text-sm text-muted-foreground">Runtime</div>
                            </div>
                            <TooltipProvider>
                              <div className="text-center">
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl font-bold text-primary">{operator.averageEfficiency.toFixed(1)}%</span>
                                  {operator.averageEfficiency > 200 && (
                                    <Tooltip>
                                      <TooltipTrigger><AlertTriangle className="h-4 w-4 text-yellow-600" /></TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        Efficiency exceeds 200% — this operator significantly exceeded the target rate. The target rate may need reviewing.
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">Efficiency</div>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5" />Machine Breakdown</CardTitle></CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader><TableRow><TableHead>Machine</TableHead><TableHead className="text-right">Hours</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Efficiency</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {Object.entries(operator.machineBreakdown)
                                    .sort(([,a], [,b]) => b.efficiency - a.efficiency)
                                    .map(([machine, data]) => (
                                      <TableRow key={machine}>
                                        <TableCell className="font-medium">{machine}</TableCell>
                                        <TableCell className="text-right">{data.runtime.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right">{data.units.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant={data.efficiency >= 80 ? "default" : data.efficiency >= 60 ? "secondary" : "destructive"}>{data.efficiency.toFixed(1)}%</Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" />SKU Breakdown</CardTitle></CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Hours</TableHead><TableHead className="text-right">Rate/h</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {(() => {
                                    const operatorSKUs = new Map();
                                    Object.entries(operator.machineBreakdown).forEach(([machineName, machineData]) => {
                                      const machineInfo = weeklyData.machines.find(m => m.machine === machineName);
                                      if (machineInfo?.skus) {
                                        machineInfo.skus.forEach(skuData => {
                                          const existing = operatorSKUs.get(skuData.sku) || { sku: skuData.sku, totalUnits: 0, totalRuntime: 0 };
                                          const operatorShare = machineData.runtime / machineInfo.totalRuntime;
                                          existing.totalUnits += Math.round(skuData.units * operatorShare);
                                          existing.totalRuntime += skuData.runtime * operatorShare;
                                          operatorSKUs.set(skuData.sku, existing);
                                        });
                                      }
                                    });
                                    return Array.from(operatorSKUs.values()).filter(s => s.totalUnits > 0).sort((a, b) => b.totalUnits - a.totalUnits).slice(0, 10).map(sku => {
                                      const rate = sku.totalRuntime > 0 ? sku.totalUnits / sku.totalRuntime : 0;
                                      return (<TableRow key={sku.sku}><TableCell className="font-medium">{sku.sku}</TableCell><TableCell className="text-right">{sku.totalUnits.toLocaleString()}</TableCell><TableCell className="text-right">{sku.totalRuntime.toFixed(1)}h</TableCell><TableCell className="text-right">{rate.toFixed(1)} u/h</TableCell></TableRow>);
                                    });
                                  })()}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="mt-6">
                          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />Daily Performance</CardTitle></CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                              {Object.entries(operator.dailyBreakdown)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([date, dayData]) => (
                                  <div key={date} className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">{format(new Date(date), 'EEE')}</div>
                                    <div className="text-xs text-muted-foreground">{format(new Date(date), 'MMM dd')}</div>
                                    <div className="text-lg font-semibold mt-1">{dayData.totalUnits.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{dayData.totalRuntime.toFixed(1)}h</div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Machine Performance Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <h3 className="text-xl font-semibold">Overall Machine Performance</h3>
                  </div>
                  <div className="border border-primary/20 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary/5">
                          <TableHead className="font-semibold">Machine</TableHead>
                          <TableHead className="text-right font-semibold">Units</TableHead>
                          <TableHead className="text-right font-semibold">Runtime</TableHead>
                          <TableHead className="text-right font-semibold">Rate</TableHead>
                          <TableHead className="text-right font-semibold">Efficiency</TableHead>
                          <TableHead className="text-right font-semibold">Utilization</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyData.machines
                          .sort((a, b) => b.efficiency - a.efficiency)
                          .map((machine) => (
                            <TableRow key={machine.machine}>
                              <TableCell className="font-medium">{machine.machine}</TableCell>
                              <TableCell className="text-right font-medium">{machine.totalUnits.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">{machine.totalRuntime.toFixed(1)}h</TableCell>
                              <TableCell className="text-right font-medium">{machine.totalRuntime > 0 ? (machine.totalUnits / machine.totalRuntime).toFixed(1) : '0'} u/h</TableCell>
                              <TableCell className={`text-right font-bold ${getPerformanceStatus(machine.efficiency).color}`}>{machine.efficiency.toFixed(1)}%</TableCell>
                              <TableCell className="text-right font-medium">{machine.utilization.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Individual laser sections */}
                {[
                  { name: 'Laser 1', color: 'red', filter: 'laser 1' },
                  { name: 'Laser 2', color: 'orange', filter: 'laser 2' },
                  { name: 'Laser 3', color: 'yellow', filter: 'laser 3' },
                ].map(({ name, color, filter }) => {
                  const laserMachines = weeklyData.machines.filter(m => m.machine.toLowerCase().includes(filter));
                  if (laserMachines.length === 0) return null;
                  return (
                    <div key={name}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-4 h-4 bg-${color}-500 rounded`}></div>
                        <h3 className={`text-xl font-semibold text-${color}-700`}>{name} Performance</h3>
                      </div>
                      <div className={`border border-${color}-200 rounded-lg overflow-hidden`}>
                        <Table>
                          <TableHeader>
                            <TableRow className={`bg-${color}-50`}>
                              <TableHead className="font-semibold">Metrics</TableHead>
                              <TableHead className="text-right font-semibold">Units</TableHead>
                              <TableHead className="text-right font-semibold">Runtime</TableHead>
                              <TableHead className="text-right font-semibold">Rate</TableHead>
                              <TableHead className="text-right font-semibold">Efficiency</TableHead>
                              <TableHead className="text-right font-semibold">Utilization</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {laserMachines.map((machine) => (
                              <TableRow key={machine.machine}>
                                <TableCell className={`font-medium text-${color}-800`}>{machine.machine}</TableCell>
                                <TableCell className="text-right font-medium">{machine.totalUnits.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-medium">{machine.totalRuntime.toFixed(1)}h</TableCell>
                                <TableCell className="text-right font-medium">{machine.totalRuntime > 0 ? (machine.totalUnits / machine.totalRuntime).toFixed(1) : '0'} u/h</TableCell>
                                <TableCell className={`text-right font-bold ${getPerformanceStatus(machine.efficiency).color}`}>{machine.efficiency.toFixed(1)}%</TableCell>
                                <TableCell className="text-right font-medium">{machine.utilization.toFixed(1)}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Detailed Production Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter bar */}
              <div className="flex flex-wrap gap-3">
                <Select value={filterOperator} onValueChange={setFilterOperator}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Operators" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Operators</SelectItem>
                    {filterOptions.operators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterMachine} onValueChange={setFilterMachine}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Machines" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Machines</SelectItem>
                    {filterOptions.machines.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterSKU} onValueChange={setFilterSKU}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All SKUs" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All SKUs</SelectItem>
                    {filterOptions.skus.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(filterOperator !== 'all' || filterMachine !== 'all' || filterSKU !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterOperator('all'); setFilterMachine('all'); setFilterSKU('all'); }}>
                    Clear filters
                  </Button>
                )}
              </div>

              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><SortableHeader label="Date" field="date" /></TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right"><SortableHeader label="Units" field="units" /></TableHead>
                      <TableHead className="text-right"><SortableHeader label="Runtime" field="runtime" /></TableHead>
                      <TableHead className="text-right"><SortableHeader label="Rate" field="rate" /></TableHead>
                      <TableHead className="text-right"><SortableHeader label="Efficiency" field="efficiency" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((row, idx) => {
                      const hasDataIssue = row.units > 0 && row.runtime === 0;
                      return (
                        <TableRow key={idx} className={hasDataIssue ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                          <TableCell>{format(new Date(row.date), 'MMM dd')}</TableCell>
                          <TableCell>{row.shiftType}</TableCell>
                          <TableCell>{row.operatorName}</TableCell>
                          <TableCell>{row.machine}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {row.sku}
                              {hasDataIssue && (
                                <Tooltip>
                                  <TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /></TooltipTrigger>
                                  <TooltipContent>Data issue: units logged with 0 hours runtime</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{row.units.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.runtime.toFixed(1)}h</TableCell>
                          <TableCell className="text-right">{row.rate.toFixed(1)} u/h</TableCell>
                          <TableCell className={`text-right ${getPerformanceStatus(row.efficiency).color}`}>{row.efficiency.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
              {weeklyData.detailedRecords.length > 200 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing first 200 of {weeklyData.detailedRecords.length} total records
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
