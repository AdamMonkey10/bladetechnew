// Card component for displaying current stock levels
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface WarehouseStockLevel {
  slot_code: string;
  product_id?: string;
  product_sku?: string;
  product_name?: string;
  quantity: number;
  location: string;
}

interface StockLevelsCardProps {
  stockLevels?: WarehouseStockLevel[];
  loading?: boolean;
}

const StockLevelsCard: React.FC<StockLevelsCardProps> = ({ stockLevels, loading }) => {
  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { 
      label: 'Empty Slot', 
      variant: 'destructive' as const, 
      color: 'text-muted-foreground',
      icon: Package 
    };
    return { 
      label: 'In Stock', 
      variant: 'outline' as const, 
      color: 'text-muted-foreground',
      icon: Package 
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Current Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading stock levels...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stockLevels || stockLevels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Warehouse Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No inventory in warehouse</p>
            <p className="text-sm text-muted-foreground mt-2">Add products to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by quantity (ascending) to show low stock slots first
  const sortedStock = [...stockLevels].sort((a, b) => a.quantity - b.quantity);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Warehouse Inventory
          <Badge variant="outline" className="ml-auto">
            {stockLevels.length} slots
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-80 overflow-y-auto space-y-3">
          {sortedStock.map((stock) => {
            const status = getStockStatus(stock.quantity);
            const StatusIcon = status.icon;

            return (
              <div key={`${stock.slot_code}-${stock.product_id}`} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      <h4 className="font-semibold text-sm">{stock.slot_code}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {stock.product_sku && stock.product_name 
                        ? `${stock.product_sku} - ${stock.product_name}`
                        : 'No product assigned'
                      }
                    </p>
                  </div>
                  <Badge variant={status.variant} className="text-xs">
                    {status.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-blue-600 mb-1">
                      <Package className="w-3 h-3" />
                      <span className="font-semibold">{stock.location}</span>
                    </div>
                    <p className="text-muted-foreground">Location</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`flex items-center gap-1 justify-center ${status.color} mb-1`}>
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-bold">{stock.quantity}</span>
                    </div>
                    <p className="text-muted-foreground">Quantity</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockLevelsCard;