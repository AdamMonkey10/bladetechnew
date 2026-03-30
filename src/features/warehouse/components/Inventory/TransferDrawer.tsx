// Stock transfer drawer component
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MoveRight, Package } from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseEvents } from '../../hooks/useWarehouseEvents';
import { useWarehouseStore } from '../../store';
import type { Product, SlotCode, StockMovement } from '../../types';

interface TransferDrawerProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

interface TransferFormData {
  fromSlot?: SlotCode;
  toSlot: SlotCode;
  quantity: number;
}

const TransferDrawer: React.FC<TransferDrawerProps> = ({ product, open, onClose }) => {
  const repo = useWarehouseRepo();
  const queryClient = useQueryClient();
  const { trackProductMove } = useWarehouseEvents();
  const { selectedSlot } = useWarehouseStore();

  const [transferType, setTransferType] = useState<'move' | 'add'>('move');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TransferFormData>({
    defaultValues: {
      fromSlot: selectedSlot?.code,
      toSlot: '' as SlotCode,
      quantity: 1
    }
  });

  const moveStockMutation = useMutation({
    mutationFn: (movement: StockMovement) => repo.moveStock(movement),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      trackProductMove(
        variables.from,
        variables.to,
        variables.productId,
        variables.qty
      );
      onClose();
      reset();
    },
  });

  const onSubmit = (data: TransferFormData) => {
    if (!product) return;

    const movement: StockMovement = {
      productId: product.id,
      qty: data.quantity,
      ...(transferType === 'move' ? { from: data.fromSlot } : {}),
      to: data.toSlot
    };

    moveStockMutation.mutate(movement);
  };

  const handleClose = () => {
    onClose();
    reset();
    setTransferType('move');
  };

  const fromSlot = watch('fromSlot');
  const toSlot = watch('toSlot');
  const quantity = watch('quantity');

  React.useEffect(() => {
    if (selectedSlot?.code && product) {
      reset({
        fromSlot: selectedSlot.code,
        toSlot: '' as SlotCode,
        quantity: Math.min(selectedSlot.quantity || 1, 1)
      });
    }
  }, [selectedSlot, product, reset]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MoveRight className="w-5 h-5" />
            Transfer Stock
          </SheetTitle>
        </SheetHeader>

        {product && (
          <div className="py-6 space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Package className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              </div>
            </div>

            {/* Transfer Type Toggle */}
            <div className="space-y-3">
              <Label>Transfer Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transferType === 'move' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferType('move')}
                >
                  Move Stock
                </Button>
                <Button
                  type="button"
                  variant={transferType === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferType('add')}
                >
                  Add to Slot
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* From Slot (only for move) */}
              {transferType === 'move' && (
                <div className="space-y-2">
                  <Label htmlFor="fromSlot">From Slot</Label>
                  <Input
                    id="fromSlot"
                    {...register('fromSlot', { 
                      required: transferType === 'move' ? 'From slot is required' : false 
                    })}
                    placeholder="e.g., A-A1-B01-S01"
                    disabled={!!selectedSlot?.code}
                  />
                  {errors.fromSlot && (
                    <p className="text-sm text-destructive">{errors.fromSlot.message}</p>
                  )}
                  {selectedSlot?.code && (
                    <Badge variant="outline" className="text-xs">
                      Available: {selectedSlot.quantity || 0} units
                    </Badge>
                  )}
                </div>
              )}

              {/* To Slot */}
              <div className="space-y-2">
                <Label htmlFor="toSlot">To Slot</Label>
                <Input
                  id="toSlot"
                  {...register('toSlot', { required: 'Destination slot is required' })}
                  placeholder="e.g., A-A1-B01-S02"
                />
                {errors.toSlot && (
                  <p className="text-sm text-destructive">{errors.toSlot.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' }
                  })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                )}
              </div>

              <Separator />

              {/* Transfer Summary */}
              <div className="space-y-3">
                <Label>Transfer Summary</Label>
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Product:</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                  {transferType === 'move' && fromSlot && (
                    <div className="flex justify-between text-sm">
                      <span>From:</span>
                      <span className="font-medium">{fromSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>To:</span>
                    <span className="font-medium">{toSlot || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity} units</span>
                  </div>
                </div>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
                </Button>
              </SheetFooter>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TransferDrawer;