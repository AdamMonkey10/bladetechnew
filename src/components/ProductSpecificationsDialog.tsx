import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const specificationSchema = z.object({
  height_min: z.number().optional(),
  height_max: z.number().optional(),
  height_target: z.number().optional(),
  blade_width_min: z.number().optional(),
  blade_width_max: z.number().optional(),
  blade_width_target: z.number().optional(),
  blade_body_min: z.number().optional(),
  blade_body_max: z.number().optional(),
  blade_body_target: z.number().optional(),
  blade_bottom_min: z.number().optional(),
  blade_bottom_max: z.number().optional(),
  blade_bottom_target: z.number().optional(),
  gauge_min: z.number().optional(),
  gauge_max: z.number().optional(),
  gauge_target: z.number().optional(),
  set_left_min: z.number().optional(),
  set_left_max: z.number().optional(),
  set_left_target: z.number().optional(),
  set_right_min: z.number().optional(),
  set_right_max: z.number().optional(),
  set_right_target: z.number().optional(),
  dross_min: z.number().optional(),
  dross_max: z.number().optional(),
  dross_target: z.number().optional(),
  flatness_min: z.number().optional(),
  flatness_max: z.number().optional(),
  flatness_target: z.number().optional(),
  tooth_set_min: z.number().optional(),
  tooth_set_max: z.number().optional(),
  tooth_set_target: z.number().optional()
});

type SpecificationForm = z.infer<typeof specificationSchema>;

interface Product {
  id: string;
  product_code: string;
  product_name: string;
}

interface ProductSpecificationsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductSpecificationsDialog({
  product,
  open,
  onOpenChange
}: ProductSpecificationsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<SpecificationForm>({
    resolver: zodResolver(specificationSchema)
  });

  useEffect(() => {
    if (product && open) {
      loadProductSpecifications();
    }
  }, [product, open]);

  const loadProductSpecifications = async () => {
    if (!product) return;

    try {
      const { data: spec } = await supabase
        .from('product_specifications')
        .select('*')
        .eq('product_code', product.product_code)
        .single();

      if (spec) {
        // Set all specification values
        Object.entries(spec).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'product_code' && key !== 'created_at' && key !== 'updated_at' && value !== null) {
            setValue(key as keyof SpecificationForm, value as number);
          }
        });
      } else {
        reset();
      }
    } catch (error) {
      reset();
    }
  };

  const onSubmit = async (data: SpecificationForm) => {
    if (!product) return;

    try {
      setLoading(true);

      // Check if specification already exists
      const { data: existingSpec } = await supabase
        .from('product_specifications')
        .select('id')
        .eq('product_code', product.product_code)
        .single();

      const specData = {
        height_min: data.height_min || null,
        height_max: data.height_max || null,
        height_target: data.height_target || null,
        blade_width_min: data.blade_width_min || null,
        blade_width_max: data.blade_width_max || null,
        blade_width_target: data.blade_width_target || null,
        blade_body_min: data.blade_body_min || null,
        blade_body_max: data.blade_body_max || null,
        blade_body_target: data.blade_body_target || null,
        blade_bottom_min: data.blade_bottom_min || null,
        blade_bottom_max: data.blade_bottom_max || null,
        blade_bottom_target: data.blade_bottom_target || null,
        gauge_min: data.gauge_min || null,
        gauge_max: data.gauge_max || null,
        gauge_target: data.gauge_target || null,
        set_left_min: data.set_left_min || null,
        set_left_max: data.set_left_max || null,
        set_left_target: data.set_left_target || null,
        set_right_min: data.set_right_min || null,
        set_right_max: data.set_right_max || null,
        set_right_target: data.set_right_target || null,
        dross_min: data.dross_min || null,
        dross_max: data.dross_max || null,
        dross_target: data.dross_target || null,
        flatness_min: data.flatness_min || null,
        flatness_max: data.flatness_max || null,
        flatness_target: data.flatness_target || null,
        tooth_set_min: data.tooth_set_min || null,
        tooth_set_max: data.tooth_set_max || null,
        tooth_set_target: data.tooth_set_target || null
      };

      if (existingSpec) {
        // Update existing specification
        const { error } = await supabase
          .from('product_specifications')
          .update(specData)
          .eq('id', existingSpec.id);

        if (error) throw error;
      } else {
        // Create new specification
        const { error } = await supabase
          .from('product_specifications')
          .insert([{
            product_code: product.product_code,
            ...specData
          }]);

        if (error) throw error;
      }

      toast({
        title: "Specifications saved successfully",
        description: `Specifications for ${product.product_code} have been saved.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving specifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSpecSection = (title: string, prefix: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_min`}>Min</Label>
          <Input
            {...register(`${prefix}_min` as keyof SpecificationForm, { valueAsNumber: true })}
            type="number"
            step="0.001"
            placeholder="0.000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_target`}>Target</Label>
          <Input
            {...register(`${prefix}_target` as keyof SpecificationForm, { valueAsNumber: true })}
            type="number"
            step="0.001"
            placeholder="0.000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_max`}>Max</Label>
          <Input
            {...register(`${prefix}_max` as keyof SpecificationForm, { valueAsNumber: true })}
            type="number"
            step="0.001"
            placeholder="0.000"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Specifications</DialogTitle>
          <DialogDescription>
            Set quality specifications for {product?.product_code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderSpecSection("Height Specifications", "height")}
          {renderSpecSection("Blade Width Specifications", "blade_width")}
          {renderSpecSection("Blade Body Specifications", "blade_body")}
          {renderSpecSection("Blade Bottom Specifications", "blade_bottom")}
          {renderSpecSection("Gauge Specifications", "gauge")}
          {renderSpecSection("Set Left Specifications", "set_left")}
          {renderSpecSection("Set Right Specifications", "set_right")}
          {renderSpecSection("Dross Specifications", "dross")}
          {renderSpecSection("Flatness Specifications", "flatness")}
          {renderSpecSection("Tooth Set Specifications", "tooth_set")}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Specifications'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}