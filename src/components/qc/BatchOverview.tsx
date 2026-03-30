import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, Settings, CheckCircle } from 'lucide-react';
import { BatchData } from '@/services/qcApiService';
import { format } from 'date-fns';

interface BatchOverviewProps {
  batch: BatchData;
}

export function BatchOverview({ batch }: BatchOverviewProps) {
  // Safety check for batch data
  if (!batch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            Batch Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No batch data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getMachineTypeIcon = (machineType: string) => {
    return <Settings className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Batch Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Batch Number</p>
              <p className="font-semibold text-lg">{batch.number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-semibold">{batch.sku}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getMachineTypeIcon(batch.machine_type)}
            <div>
              <p className="text-sm text-muted-foreground">Machine Type</p>
              <Badge variant="outline" className="mt-1">
                {batch.machine_type.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-semibold">
                {format(new Date(batch.completed_at), 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(batch.completed_at), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={getStatusVariant(batch.status)}>
              {batch.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}