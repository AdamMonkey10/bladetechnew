import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, AlertTriangle, ArrowUpDown } from 'lucide-react';

interface SKUData {
  sku: string;
  totalUnits: number;
  totalRuntime: number;
  machines: string[];
}

interface SKUsListProps {
  skus: SKUData[];
  onSKUClick?: (sku: SKUData) => void;
}

type SortKey = 'sku' | 'totalUnits' | 'totalRuntime' | 'rate';

export function SKUsList({ skus, onSKUClick }: SKUsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalUnits');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'sku'); }
  };

  const sortedSKUs = [...skus].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'sku': cmp = a.sku.localeCompare(b.sku); break;
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
          <Package className="h-5 w-5" />
          SKUs ({skus.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="SKU" field="sku" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Units" field="totalUnits" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Hours" field="totalRuntime" /></TableHead>
                <TableHead className="text-right"><SortHeader label="Rate" field="rate" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSKUs.map((sku) => {
                const rate = sku.totalRuntime > 0 
                  ? Math.round(sku.totalUnits / sku.totalRuntime) 
                  : 0;
                const hasDataIssue = sku.totalUnits > 0 && sku.totalRuntime === 0;
                
                return (
                  <TableRow
                    key={sku.sku}
                    className={`${onSKUClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${hasDataIssue ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                    onClick={() => onSKUClick?.(sku)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {sku.sku}
                        {hasDataIssue && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                            </TooltipTrigger>
                            <TooltipContent>Units logged with 0 hours — possible data issue</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {sku.totalUnits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {sku.totalRuntime.toFixed(1)}h
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
