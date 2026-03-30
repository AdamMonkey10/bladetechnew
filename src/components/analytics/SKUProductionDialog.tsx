import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Package, TrendingUp, Clock, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SKUProductionDialogProps {
  sku: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductionRecord {
  shift_date: string;
  operator_name: string;
  machine_name: string;
  units_produced: number;
  time_spent: number;
  scrap: number;
}

export function SKUProductionDialog({ sku, open, onOpenChange }: SKUProductionDialogProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const { data: productionData, isLoading } = useQuery({
    queryKey: ['sku-production', sku, dateRange],
    queryFn: async () => {
      if (!sku) return [];

      console.log('Fetching SKU production for:', sku, 'Date range:', dateRange);

      const { data, error } = await supabase
        .from('shift_records')
        .select(`
          shift_date,
          production_data,
          operators(operator_name),
          machines(machine_name)
        `)
        .gte('shift_date', dateRange.from?.toISOString().split('T')[0])
        .lte('shift_date', dateRange.to?.toISOString().split('T')[0])
        .not('production_data', 'is', null)
        .order('shift_date', { ascending: false });

      if (error) {
        console.error('Error fetching SKU production:', error);
        throw error;
      }

      console.log('Fetched shift records:', data?.length);

      const records: ProductionRecord[] = [];
      
      data?.forEach((record) => {
        const pd = record.production_data as any;
        const operatorName = pd?.operator_name || 'Unknown';
        const activities = pd?.activities;
        if (!activities) return;

        if (Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            const entries = activity?.entries || [];
            entries.forEach((entry: any) => {
              const entrySku = entry.sku || entry.SKU;
              if (entrySku === sku) {
                records.push({
                  shift_date: record.shift_date,
                  operator_name: operatorName,
                  machine_name: record.machines?.machine_name || activity.name || 'Unknown',
                  units_produced: entry.units_produced ?? entry.UnitsProduced ?? 0,
                  time_spent: entry.time_spent ?? entry.TimeSpent ?? 0,
                  scrap: entry.scrap ?? entry.Scrap ?? 0,
                });
              }
            });
          });
        } else if (typeof activities === 'object') {
          Object.entries(activities).forEach(([activityName, entries]: [string, any]) => {
            if (Array.isArray(entries)) {
              entries.forEach((entry: any) => {
                const entrySku = entry.sku || entry.SKU;
                if (entrySku === sku) {
                  records.push({
                    shift_date: record.shift_date,
                    operator_name: operatorName,
                    machine_name: activityName || 'Unknown',
                    units_produced: entry.units_produced ?? entry.UnitsProduced ?? 0,
                    time_spent: entry.time_spent ?? entry.TimeSpent ?? 0,
                    scrap: entry.scrap ?? entry.Scrap ?? 0,
                  });
                }
              });
            }
          });
        }
      });

      console.log('Found production records for SKU:', records.length);
      return records;
    },
    enabled: !!sku && open,
  });

  const summary = productionData?.reduce(
    (acc, record) => ({
      totalUnits: acc.totalUnits + record.units_produced,
      totalTime: acc.totalTime + record.time_spent,
      totalScrap: acc.totalScrap + record.scrap,
      uniqueMachines: new Set([...acc.uniqueMachines, record.machine_name]),
      uniqueOperators: new Set([...acc.uniqueOperators, record.operator_name]),
    }),
    {
      totalUnits: 0,
      totalTime: 0,
      totalScrap: 0,
      uniqueMachines: new Set<string>(),
      uniqueOperators: new Set<string>(),
    }
  );

  const avgRate = summary && summary.totalTime > 0 
    ? Math.round(summary.totalUnits / summary.totalTime) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Production Details: {sku}
          </DialogTitle>
          <DialogDescription>
            View production records and performance for this SKU. Use the date range to filter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Date Range:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`
                    : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Units
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalUnits.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Total Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalTime.toFixed(1)}h</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Avg Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgRate}/h</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Cpu className="h-4 w-4" />
                    Machines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.uniqueMachines.size}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Scrap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{summary.totalScrap}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Production Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Production Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : productionData && productionData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Scrap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionData.map((record, idx) => {
                      const rate = record.time_spent > 0
                        ? Math.round(record.units_produced / record.time_spent)
                        : 0;
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {format(new Date(record.shift_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{record.operator_name}</TableCell>
                          <TableCell>{record.machine_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {record.units_produced.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.time_spent.toFixed(1)}h
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={rate > 200 ? 'default' : 'secondary'}>
                              {rate}/h
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {record.scrap > 0 && (
                              <span className="text-destructive font-medium">{record.scrap}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No production records found for this date range
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
