import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, AlertTriangle, ArrowUpDown } from 'lucide-react';

interface EmployeeData {
  operatorName: string;
  operatorCode: string;
  totalRuntime: number;
  totalUnits: number;
  totalScrap: number;
  averageEfficiency: number;
  machines: string[];
}

interface EmployeesListProps {
  employees: EmployeeData[];
  onEmployeeClick?: (employee: EmployeeData) => void;
}

type SortKey = 'name' | 'totalUnits' | 'totalRuntime' | 'rate';

export function EmployeesList({ employees, onEmployeeClick }: EmployeesListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalUnits');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = a.operatorName.localeCompare(b.operatorName); break;
      case 'totalUnits': cmp = a.totalUnits - b.totalUnits; break;
      case 'totalRuntime': cmp = a.totalRuntime - b.totalRuntime; break;
      case 'rate': {
        const rA = a.totalRuntime > 0 ? a.totalUnits / a.totalRuntime : 0;
        const rB = b.totalRuntime > 0 ? b.totalUnits / b.totalRuntime : 0;
        cmp = rA - rB;
        break;
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort(field)}>
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-50" />
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employees ({employees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Name" field="name" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Blades" field="totalUnits" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Hours" field="totalRuntime" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Rate" field="rate" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => {
                const rate = employee.totalRuntime > 0 
                  ? Math.round(employee.totalUnits / employee.totalRuntime) 
                  : 0;
                const hasDataIssue = employee.totalUnits > 0 && employee.totalRuntime === 0;
                
                return (
                  <TableRow
                    key={employee.operatorCode}
                    className={`${onEmployeeClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${hasDataIssue ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                    onClick={() => onEmployeeClick?.(employee)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {employee.operatorName}
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
                      {employee.totalUnits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {employee.totalRuntime.toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rate > 200 ? 'default' : 'secondary'}>
                        {rate}/h
                      </Badge>
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
