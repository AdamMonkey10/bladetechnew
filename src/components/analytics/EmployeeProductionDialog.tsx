import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Package, User } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EmployeeProductionDialogProps {
  employeeName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductionRecord {
  shift_date: string;
  machine_name: string;
  sku: string;
  units_produced: number;
  time_spent: number;
  scrap: number;
}

export function EmployeeProductionDialog({ employeeName, open, onOpenChange }: EmployeeProductionDialogProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: productionRecords, isLoading } = useQuery({
    queryKey: ['employee-production', employeeName, dateRange],
    queryFn: async () => {
      if (!employeeName) return [];

      const { data, error } = await supabase
        .from('shift_records')
        .select(`
          shift_date,
          production_data,
          machines (machine_name)
        `)
        .gte('shift_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('shift_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('shift_date', { ascending: false });

      if (error) throw error;

      const records: ProductionRecord[] = [];
      
      data?.forEach((record) => {
        const pd = record.production_data as any;
        const operatorName = pd?.operator_name;
        
        if (operatorName !== employeeName) return;

        const activities = pd?.activities;
        if (!activities) return;

        if (Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            const entries = activity?.entries || [];
            entries.forEach((entry: any) => {
              const entrySku = entry.sku || entry.SKU;
              if (entrySku && entry.units_produced) {
                records.push({
                  shift_date: record.shift_date,
                  machine_name: record.machines?.machine_name || activity.name || 'Unknown',
                  sku: entrySku,
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
                if (entrySku && entry.units_produced) {
                  records.push({
                    shift_date: record.shift_date,
                    machine_name: activityName || 'Unknown',
                    sku: entrySku,
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

      return records;
    },
    enabled: open && !!employeeName,
  });

  const summary = productionRecords?.reduce(
    (acc, record) => ({
      totalUnits: acc.totalUnits + record.units_produced,
      totalHours: acc.totalHours + record.time_spent,
      totalScrap: acc.totalScrap + record.scrap,
    }),
    { totalUnits: 0, totalHours: 0, totalScrap: 0 }
  );

  const rate = summary && summary.totalHours > 0 
    ? Math.round(summary.totalUnits / summary.totalHours) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Production Details: {employeeName}
          </DialogTitle>
          <DialogDescription>
            View production records and performance for this employee. Use the date range to filter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filter by Date Range</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  />
                </PopoverContent>
              </Popover>
              <span className="self-center">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.totalUnits.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{rate}/h</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Scrap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.totalScrap}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Production Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Production Records ({productionRecords?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !productionRecords || productionRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No production records found for this date range
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Scrap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionRecords.map((record, idx) => {
                      const recordRate = record.time_spent > 0 
                        ? Math.round(record.units_produced / record.time_spent) 
                        : 0;
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell>{format(new Date(record.shift_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{record.machine_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.sku}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {record.units_produced.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.time_spent.toFixed(1)}h
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={recordRate > 250 ? "default" : "secondary"}>
                              {recordRate}/h
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{record.scrap}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
