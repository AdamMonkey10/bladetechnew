import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CustomerPO, POLineItem, LineItemProgress } from '@/hooks/useCustomerPOs';
import { formatDate } from '@/utils/dateUtils';
import { Check, Edit, ChevronDown, ChevronRight } from 'lucide-react';

interface POListProps {
  pos: CustomerPO[];
  onEdit: (po: CustomerPO) => void;
  onComplete: (id: string) => void;
  onUpdateLineItem: (poId: string, itemIndex: number, updates: Partial<POLineItem>) => void;
  isLoading: boolean;
}

const StatusBadge: React.FC<{ status: boolean | string }> = ({ status }) => {
  if (typeof status === 'boolean') {
    return (
      <Badge variant={status ? 'default' : 'secondary'}>
        {status ? 'COMPLETE' : 'ACTIVE'}
      </Badge>
    );
  }
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'pending':
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
      case 'pending':
      default: return 'Pending';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};

export const POList: React.FC<POListProps> = ({ 
  pos, 
  onEdit, 
  onComplete, 
  onUpdateLineItem, 
  isLoading 
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleStatusChange = async (poId: string, itemIndex: number, newStatus: string) => {
    console.log('Updating status:', { poId, itemIndex, newStatus });
    await onUpdateLineItem(poId, itemIndex, { status: newStatus as POLineItem['status'] });
  };

  // Sort POs by delivery date (earliest first, nulls last)
  const sortedPos = [...pos].sort((a, b) => {
    if (!a.delivery_date && !b.delivery_date) return 0;
    if (!a.delivery_date) return 1;
    if (!b.delivery_date) return -1;
    return new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime();
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">Loading purchase orders...</div>
        </CardContent>
      </Card>
    );
  }

  if (pos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No purchase orders found. Create your first PO to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Purchase Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>PO Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPos.map((po) => (
                <TableRow key={po.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>{po.customer_name}</TableCell>
                  <TableCell>
                    {formatDate(po.po_date)}
                  </TableCell>
                  <TableCell>
                    {po.delivery_date ? formatDate(po.delivery_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 h-auto font-normal justify-start"
                          onClick={() => toggleRow(po.id)}
                        >
                          {expandedRows.has(po.id) ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                          )}
                          {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="space-y-2">
                          {po.items.map((item, index) => {
                            const lineItemProgress = po.line_item_progress?.[index.toString()] as LineItemProgress;
                            const itemPrinted = Number(lineItemProgress?.printed || 0);
                            const itemRequired = Number(lineItemProgress?.required || item.quantity);
                            const itemProgress = Number(lineItemProgress?.progress || 0);
                            
                            return (
                              <div key={index} className="bg-muted/30 p-3 rounded space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <span className="font-medium">{item.sku}</span>
                                    <span>× {item.quantity}</span>
                                    {item.dispatch_date && (
                                      <span className="text-muted-foreground text-xs">
                                        Due: {formatDate(item.dispatch_date, 'dd/MM')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={item.status || 'pending'}
                                      onValueChange={(value) => handleStatusChange(po.id, index, value)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <StatusBadge status={item.status || 'pending'} />
                                  </div>
                                </div>
                                
                                {/* Individual line item progress */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progress:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{itemPrinted} / {itemRequired}</span>
                                      <span className="text-sm font-medium">{itemProgress.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <Progress value={itemProgress} className="h-1.5" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 min-w-[200px]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Progress</span>
                        <span className="text-muted-foreground">{Math.round(po.progress_percentage || 0)}%</span>
                      </div>
                      <Progress value={po.progress_percentage || 0} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Number(po.total_printed || 0)} / {po.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0} units</span>
                        <span>{Number(po.boxes_printed || 0)} boxes</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={po.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(po)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!po.status && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onComplete(po.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};