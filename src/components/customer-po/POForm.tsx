import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, Plus } from 'lucide-react';
import { CustomerPO, POLineItem } from '@/hooks/useCustomerPOs';
import { useCustomers } from '@/hooks/useCustomers';

interface POFormProps {
  po?: CustomerPO;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const POForm: React.FC<POFormProps> = ({ po, onSubmit, onCancel, isLoading }) => {
  const { customers } = useCustomers();
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customer_name: po?.customer_name || '',
      customer_template_id: po?.customer_template_id || 'default',
      po_number: po?.po_number || '',
      po_date: po?.po_date || new Date().toISOString().split('T')[0],
      delivery_date: po?.delivery_date || '',
      status: po?.status || false,
      notes: po?.notes || '',
      items: po?.items || [{ sku: '', quantity: 1, dispatch_date: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const addLineItem = () => {
    append({ sku: '', quantity: 1, dispatch_date: '' });
  };

  const handleFormSubmit = (data: any) => {
    // Convert "default" template selection back to null for database
    const submissionData = {
      ...data,
      customer_template_id: data.customer_template_id === 'default' ? null : data.customer_template_id
    };
    onSubmit(submissionData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{po ? 'Edit Customer PO' : 'New Customer PO'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input 
                id="customer_name"
                {...register('customer_name', { required: 'Customer name is required' })}
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <p className="text-sm text-destructive mt-1">{errors.customer_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer_template">Customer Label Template (Optional)</Label>
              <Select
                value={watch('customer_template_id')}
                onValueChange={(value) => setValue('customer_template_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use default Bladetech logo or select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Bladetech Logo</SelectItem>
                  {customers.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.customer_name} - {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="po_number">PO Number</Label>
              <Input 
                id="po_number"
                {...register('po_number', { required: 'PO number is required' })}
                placeholder="Enter PO number"
              />
              {errors.po_number && (
                <p className="text-sm text-destructive mt-1">{errors.po_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="po_date">PO Date</Label>
              <Input 
                id="po_date"
                type="date"
                {...register('po_date', { required: 'PO date is required' })}
              />
              {errors.po_date && (
                <p className="text-sm text-destructive mt-1">{errors.po_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input 
                id="delivery_date"
                type="date"
                {...register('delivery_date')}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={watch('status')}
                onCheckedChange={(checked) => setValue('status', checked)}
              />
              <Label htmlFor="status">
                {watch('status') ? 'Complete' : 'Active'}
              </Label>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button type="button" onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>SKU</Label>
                      <Input
                        {...register(`items.${index}.sku`, { 
                          required: 'SKU is required'
                        })}
                        placeholder="Enter SKU"
                      />
                      {errors.items?.[index]?.sku && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.items[index]?.sku?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, { 
                          required: 'Quantity is required',
                          min: { value: 1, message: 'Quantity must be at least 1' }
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Dispatch Date</Label>
                      <Input
                        type="date"
                        {...register(`items.${index}.dispatch_date`)}
                      />
                    </div>

                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes"
              {...register('notes')}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (po ? 'Update PO' : 'Create PO')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};