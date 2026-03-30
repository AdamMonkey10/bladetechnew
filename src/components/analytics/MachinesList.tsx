import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cpu, AlertTriangle, ArrowUpDown } from 'lucide-react';

interface MachineData {
  machine: string;
  totalRuntime: number;
  totalUnits: number;
  totalScrap: number;
  utilization: number;
  efficiency: number;
}

interface MachinesListProps {
  machines: MachineData[];
  onMachineClick?: (machine: MachineData) => void;
}

type SortKey = 'machine' | 'totalUnits' | 'totalRuntime' | 'rate';

export function MachinesList({ machines, onMachineClick }: MachinesListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalUnits');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'machine');
    }
  };

  const sortedMachines = [...machines].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'machine': cmp = a.machine.localeCompare(b.machine); break;
      case 'totalUnits': cmp = a.totalUnits - b.totalUnits; break;
      case 'totalRuntime': cmp = a.totalRuntime - b.totalRuntime; break;
      case 'rate': {
        const rateA = a.totalRuntime > 0 ? a.totalUnits / a.totalRuntime : 0;
        const rateB = b.totalRuntime > 0 ? b.totalUnits / b.totalRuntime : 0;
        cmp = rateA - rateB;
        break;
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Machines ({machines.filter(m => m.totalUnits > 0).length} active)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Machine" field="machine" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Blades" field="totalUnits" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Hours" field="totalRuntime" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Rate" field="rate" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMachines.map((machine) => {
                const rate = machine.totalRuntime > 0 
                  ? Math.round(machine.totalUnits / machine.totalRuntime) 
                  : 0;
                const hasDataIssue = machine.totalUnits > 0 && machine.totalRuntime === 0;
                const isOffline = machine.totalUnits === 0 && machine.totalRuntime === 0;
                
                return (
                  <TableRow
                    key={machine.machine}
                    className={`${onMachineClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${hasDataIssue ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                    onClick={() => onMachineClick?.(machine)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {machine.machine}
                        {hasDataIssue && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                            </TooltipTrigger>
                            <TooltipContent>Missing timesheet data — units logged with 0 hours</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {isOffline ? (
                        <Badge variant="outline" className="text-xs">No Data</Badge>
                      ) : (
                        machine.totalUnits.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isOffline ? '—' : `${machine.totalRuntime.toFixed(1)}h`}
                    </TableCell>
                    <TableCell className="text-right">
                      {isOffline ? '—' : (
                        <Badge variant={rate > 250 ? 'default' : 'secondary'}>
                          {rate}/h
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
