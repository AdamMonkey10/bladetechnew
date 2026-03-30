// Table component for displaying goods movements
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownCircle, ArrowUpCircle, Package, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface WarehouseMovement {
  id: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER';
  product_id: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  created_at: string;
  notes?: string;
  user_id?: string;
  weight_kg?: number;
  warehouse_products?: {
    sku: string;
    name: string;
  };
}

interface GoodsMovementTableProps {
  movements: WarehouseMovement[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  showMovementType?: boolean;
  compact?: boolean;
}

const GoodsMovementTable: React.FC<GoodsMovementTableProps> = ({ 
  movements, 
  loading = false, 
  title,
  emptyMessage = "No movements recorded yet",
  compact = false,
  showMovementType = false
}) => {
  const getMovementBadge = (type: 'IN' | 'OUT' | 'TRANSFER') => {
    if (type === 'IN') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
          <ArrowDownCircle className="w-3 h-3" />
          IN
        </Badge>
      );
    }
    if (type === 'OUT') {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1">
          <ArrowUpCircle className="w-3 h-3" />
          OUT
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Package className="w-3 h-3" />
        TRANSFER
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="text-muted-foreground">Loading movements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-4">
      {movements.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {showMovementType && (
                <TableHead className="w-[100px]">Type</TableHead>
              )}
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>From Slot</TableHead>
              <TableHead>To Slot</TableHead>
              {!compact && (
                <TableHead>Notes</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id} className="hover:bg-muted/30">
                {showMovementType && (
                  <TableCell>
                    {getMovementBadge(movement.movement_type)}
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {movement.warehouse_products?.sku || movement.product_id}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {movement.quantity.toLocaleString()}
                </TableCell>
                <TableCell>{movement.from_location_id || '-'}</TableCell>
                <TableCell>{movement.to_location_id || '-'}</TableCell>
                {!compact && (
                  <TableCell className="max-w-xs truncate">{movement.notes || '-'}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

export default GoodsMovementTable;