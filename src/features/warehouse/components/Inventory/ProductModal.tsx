// Product creation/editing modal
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseEvents } from '../../hooks/useWarehouseEvents';
import type { Product } from '../../types';

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  isOtherStock?: boolean; // Flag for simplified form
}

type ProductFormData = Omit<Product, 'id'> & { id?: string };

const ProductModal: React.FC<ProductModalProps> = ({ product, open, onClose, isOtherStock = false }) => {
  const repo = useWarehouseRepo();
  const queryClient = useQueryClient();
  const { trackProductCreation } = useWarehouseEvents();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    defaultValues: product || {
      sku: '',
      name: '',
      barcode: '',
      weightKg: undefined,
      minQty: undefined,
      maxQty: undefined,
      attributes: {}
    }
  });

  const upsertProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const productData: Product = {
        ...data,
        id: product?.id || `prod-${Date.now()}`
      };
      return repo.upsertProduct(productData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'products'] });
      if (!product) {
        trackProductCreation(variables.id || 'unknown', variables.sku);
      }
      onClose();
      reset();
    },
  });

  const onSubmit = (data: ProductFormData) => {
    upsertProductMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  React.useEffect(() => {
    if (product) {
      reset(product);
    }
  }, [product, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Create Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isOtherStock ? (
            // Simplified form for "other" stock type
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Product name is required' })}
                  placeholder="e.g., Widget Type A"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg) *</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.01"
                  {...register('weightKg', { 
                    required: 'Weight is required',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'Weight must be greater than 0' }
                  })}
                  placeholder="0.00"
                />
                {errors.weightKg && (
                  <p className="text-sm text-destructive">{errors.weightKg.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('attributes.description')}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            // Full form for regular products
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    {...register('sku', { required: 'SKU is required' })}
                    placeholder="e.g., SKU-0001"
                  />
                  {errors.sku && (
                    <p className="text-sm text-destructive">{errors.sku.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    {...register('barcode')}
                    placeholder="e.g., 1234567890123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Product name is required' })}
                  placeholder="e.g., Widget Type A"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.01"
                    {...register('weightKg', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minQty">Min Qty</Label>
                  <Input
                    id="minQty"
                    type="number"
                    {...register('minQty', { valueAsNumber: true })}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxQty">Max Qty</Label>
                  <Input
                    id="maxQty"
                    type="number"
                    {...register('maxQty', { valueAsNumber: true })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('attributes.category')}
                  placeholder="e.g., Electronics, Hardware"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('attributes.description')}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : product ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;