// Form for recording outgoing goods
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

const warehouseOutSchema = z.object({
  quantity: z.number({
    required_error: "Quantity is required",
  }).min(1, "Quantity must be greater than 0"),
  from_slot_code: z.string({
    required_error: "Please select a source slot",
  }),
  product_id: z.string({
    required_error: "Please select a product",
  }),
  notes: z.string().optional(),
});

interface GoodsOutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GoodsOutForm: React.FC<GoodsOutFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    quantity: 0,
    from_slot_code: '',
    product_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch warehouse products and available inventory
  const { data: availableInventory } = useQuery({
    queryKey: ['warehouse-inventory-with-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_slot_inventory')
        .select(`
          slot_code,
          quantity,
          product_id,
          warehouse_products!inner (
            sku,
            name
          )
        `)
        .gt('quantity', 0)
        .order('slot_code');
      
      if (error) throw error;
      return data;
    },
  });

  // Get available stock for selected slot and product
  const selectedInventory = availableInventory?.find(
    (item: any) => item.slot_code === formData.from_slot_code && item.product_id === formData.product_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = warehouseOutSchema.parse(formData);

      // Check if enough stock is available
      if (selectedInventory && validatedData.quantity > selectedInventory.quantity) {
        setErrors({ 
          quantity: `Insufficient stock. Available: ${selectedInventory.quantity} units` 
        });
        setIsSubmitting(false);
        return;
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('warehouse_stock_movements')
        .insert({
          movement_type: 'OUT',
          product_id: validatedData.product_id,
          from_slot_code: validatedData.from_slot_code,
          quantity: validatedData.quantity,
          notes: validatedData.notes,
          performed_by: user?.id,
        });

      if (movementError) throw movementError;

      // Update slot inventory (reduce quantity)
      const newQuantity = selectedInventory!.quantity - validatedData.quantity;
      
      if (newQuantity > 0) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('warehouse_slot_inventory')
          .update({
            quantity: newQuantity
          })
          .eq('slot_code', validatedData.from_slot_code)
          .eq('product_id', validatedData.product_id);
        
        if (updateError) throw updateError;
      } else {
        // Remove inventory record if quantity becomes 0
        const { error: deleteError } = await supabase
          .from('warehouse_slot_inventory')
          .delete()
          .eq('slot_code', validatedData.from_slot_code)
          .eq('product_id', validatedData.product_id);
        
        if (deleteError) throw deleteError;
      }

      // Reset form
      setFormData({
        quantity: 0,
        from_slot_code: '',
        product_id: '',
        notes: '',
      });

      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Failed to record goods dispatch. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-orange-600" />
            Record Goods Out
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Slot */}
            <div className="space-y-2">
              <Label>Source Slot *</Label>
              <Select value={formData.from_slot_code} onValueChange={(value) => setFormData(prev => ({ ...prev, from_slot_code: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableInventory?.map((item: any) => (
                    <SelectItem key={`${item.slot_code}-${item.product_id}`} value={item.slot_code}>
                      {item.slot_code} - {item.warehouse_products.sku} (Qty: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.from_slot_code && <p className="text-sm text-destructive">{errors.from_slot_code}</p>}
            </div>

            {/* Product (auto-filled based on slot selection) */}
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                disabled={!formData.from_slot_code}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select slot first" />
                </SelectTrigger>
                <SelectContent>
                  {availableInventory
                    ?.filter((item: any) => item.slot_code === formData.from_slot_code)
                    .map((item: any) => (
                      <SelectItem key={item.product_id} value={item.product_id}>
                        {item.warehouse_products.sku} - {item.warehouse_products.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
            </div>
          </div>

          {/* Quantity with Stock Check */}
          <div className="space-y-2">
            <Label>Quantity to Remove *</Label>
            <Input
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              min="1"
              max={selectedInventory?.quantity || undefined}
              required
            />
            {selectedInventory && (
              <p className="text-xs text-muted-foreground">
                Available: {selectedInventory.quantity} units
              </p>
            )}
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this dispatch..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Record Goods Out
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoodsOutForm;