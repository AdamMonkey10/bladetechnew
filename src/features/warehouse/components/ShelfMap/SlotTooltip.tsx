// Tooltip component for slot details
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  ArrowRight,
  Truck,
  Weight,
  Box
} from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseStore } from '../../store';
import type { Level } from '../../types';

interface SlotTooltipProps {
  slot: Level;
}

const SlotTooltip: React.FC<SlotTooltipProps> = ({ slot }) => {
  const repo = useWarehouseRepo();
  const { permissions } = useWarehouseStore();

  const { data: inventory } = useQuery({
    queryKey: ['warehouse', 'slot-inventory', slot.id],
    queryFn: () => repo.getSlotInventory(slot.code),
    enabled: !!slot.productId,
  });

  const formatSlotCode = (code: string) => {
    return code; // A-10-A-11 format is already readable
  };

  const getStatusConfig = () => {
    const hasStock = slot.quantity && slot.quantity > 0;
    if (hasStock) return {
      variant: 'default' as const,
      label: 'In Use',
      icon: Package,
      color: 'text-primary'
    };
    return {
      variant: 'outline' as const,
      label: 'Empty',
      icon: MapPin,
      color: 'text-muted-foreground'
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">
            {formatSlotCode(slot.code)}
          </CardTitle>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Level</div>
              <div className="font-medium">{slot.levelNumber}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Code</div>
              <div className="font-mono text-xs">{slot.code}</div>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Box className="w-4 h-4" />
            Stock
          </h4>
          <div className="space-y-2">
            <div className="text-sm">
              Current: {slot.quantity || 0} units
            </div>
          </div>
        </div>

        {/* Weight Limit */}
        {slot.maxWeightKg && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Weight Limit
            </h4>
            <div className="text-sm">
              Max: {slot.maxWeightKg} kg per level
            </div>
          </div>
        )}

        {/* Product Information */}
        {slot.productId && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Details
            </h4>
            <div className="space-y-1">
              <div className="font-mono text-sm bg-muted/50 p-2 rounded">
                {inventory?.product?.name || slot.productId}
              </div>
              {inventory?.product?.sku && (
                <div className="text-xs text-muted-foreground">
                  SKU: {inventory.product.sku}
                </div>
              )}
              {inventory?.product?.expiryDate && (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3" />
                  Expires: {new Date(inventory.product.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Constraints */}
        {slot.constraints && slot.constraints.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Constraints</h4>
            <div className="flex flex-wrap gap-1">
              {slot.constraints.map((constraint, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {permissions.canWrite && (
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              className="w-full flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Transfer Stock
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlotTooltip;