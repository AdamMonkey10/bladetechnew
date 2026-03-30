// Form for recording warehouse putaway from QC-approved goods
import React, { useState, useEffect } from 'react';
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
import { ArrowDownCircle, Package, AlertCircle, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { validateBayWeight, WeightValidationResult } from '../../utils/weightValidation';
import type { SlotCode } from '../../types';
import { useProducts } from '@/hooks/useReferenceData';

interface QCApprovedGoods {
  id: string;
  sku: string;
  invoice: string | null;
  quantity_received: number;
  warehouse_quantity_moved?: number;
  pallet_number: number | null;
  reference_number: string | null;
  received_date: string;
  supplier?: string | null;
}

type StockType = 'qc_approved' | 'other_stock' | 'finished_goods';

const warehouseInSchema = z.object({
  stock_type: z.enum(['qc_approved', 'other_stock', 'finished_goods']),
  quantity: z.number({
    required_error: "Quantity is required",
  }).min(1, "Quantity must be greater than 0"),
  weight_kg: z.number({
    required_error: "Weight is required",
  }).min(0.1, "Weight must be greater than 0"),
  goods_received_id: z.string().optional(),
  sku: z.string().optional(),
  product_name: z.string().optional(),
  description: z.string().optional(),
  invoice: z.string().optional(),
  po: z.string().optional(),
  to_slot_code: z.string({
    required_error: "Please select a destination slot",
  }),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.stock_type === 'qc_approved') {
    return !!data.goods_received_id;
  } else {
    return !!data.sku && !!data.product_name;
  }
}, {
  message: "Please fill in required fields based on stock type",
  path: ["stock_type"],
});

interface GoodsInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GoodsInForm: React.FC<GoodsInFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const warehouseRepo = useWarehouseRepo();
  
  const [formData, setFormData] = useState({
    stock_type: 'qc_approved' as StockType,
    quantity: 0,
    weight_kg: 0,
    goods_received_id: '',
    sku: '',
    product_name: '',
    description: '',
    invoice: '',
    po: '',
    to_slot_code: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightValidation, setWeightValidation] = useState<WeightValidationResult | null>(null);
  const [searchFilter, setSearchFilter] = useState({
    invoice: 'all',
    pallet: '',
    sku: 'all',
  });
  
  // Fetch products for SKU dropdown
  const { data: products = [] } = useProducts();

  // Fetch QC-approved goods available for warehouse putaway
  const { data: qcApprovedGoods = [] } = useQuery({
    queryKey: ['qc-approved-goods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_received')
        .select(`
          *,
          suppliers(name),
          raw_materials(material_name)
        `)
        .eq('good_status', true)
        .in('warehouse_status', ['pending', 'partial'])
        .order('received_date', { ascending: false });
      
      if (error) throw error;
      return data as QCApprovedGoods[];
    },
    enabled: formData.stock_type === 'qc_approved',
  });

  // Filter QC approved goods based on search criteria
  const filteredQcGoods = qcApprovedGoods.filter(goods => {
    const matchesInvoice = searchFilter.invoice === 'all' || !searchFilter.invoice || goods.invoice === searchFilter.invoice;
    const matchesPallet = !searchFilter.pallet || 
      goods.pallet_number?.toString().includes(searchFilter.pallet);
    const matchesSku = searchFilter.sku === 'all' || !searchFilter.sku || goods.sku === searchFilter.sku;
    
    return matchesInvoice && matchesPallet && matchesSku;
  });

  // Get unique invoices and SKUs for dropdown options
  const availableInvoices = [...new Set(qcApprovedGoods.map(goods => goods.invoice).filter(Boolean))].sort();
  const availableSkus = [...new Set(qcApprovedGoods.map(goods => goods.sku))].sort();

  // Get selected goods details for quantity validation
  const selectedGoods = qcApprovedGoods.find(goods => goods.id === formData.goods_received_id);
  const availableQuantity = selectedGoods ? selectedGoods.quantity_received - selectedGoods.warehouse_quantity_moved : 0;

  // Fetch warehouse layout and slot inventories for weight validation
  const { data: warehouseLayout } = useQuery({
    queryKey: ['warehouse-layout'],
    queryFn: () => warehouseRepo.getLayout(),
  });

  const { data: slotInventories = {} } = useQuery({
    queryKey: ['slot-inventories'],
    queryFn: async () => {
      // Get all slot inventories for weight calculation
      const { data, error } = await supabase
        .from('warehouse_slot_inventory')
        .select(`
          slot_code,
          quantity,
          warehouse_products(weight_kg)
        `);
      
      if (error) throw error;
      
      const inventories: Record<SlotCode, { totalWeightKg: number }> = {};
      data?.forEach(item => {
        const weight = (item.warehouse_products as any)?.weight_kg || 0;
        inventories[item.slot_code as SlotCode] = {
          totalWeightKg: item.quantity * weight
        };
      });
      
      return inventories;
    },
  });

  // Validate bay weight when weight or slot changes
  useEffect(() => {
    if (formData.weight_kg > 0 && formData.to_slot_code && warehouseLayout && slotInventories) {
      const validation = validateBayWeight(
        warehouseLayout,
        formData.to_slot_code as SlotCode,
        formData.weight_kg,
        slotInventories
      );
      setWeightValidation(validation);
    } else {
      setWeightValidation(null);
    }
  }, [formData.weight_kg, formData.to_slot_code, warehouseLayout, slotInventories]);

  // For now, use a simple slot code input since warehouse_slots table doesn't exist
  const availableSlots = [
    { slot_code: 'A-01-01-01', capacity_units: 100 },
    { slot_code: 'A-01-01-02', capacity_units: 100 },
    { slot_code: 'A-01-02-01', capacity_units: 100 },
    { slot_code: 'B-01-01-01', capacity_units: 100 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      // Validate form data
      const validatedData = warehouseInSchema.parse(formData);
      console.log('Validated data:', validatedData);
      
      // Check available quantity
      if (validatedData.quantity > availableQuantity) {
        throw new Error(`Quantity exceeds available amount (${availableQuantity})`);
      }

      // Check bay weight validation
      if (weightValidation && !weightValidation.isValid) {
        throw new Error(weightValidation.errorMessage || 'Weight limit exceeded');
      }

      // Update slot inventory - we'll need to create a warehouse product entry if it doesn't exist
      let productId: string;
      let productSku: string;
      let productName: string;
      
      if (validatedData.stock_type === 'qc_approved') {
        if (!selectedGoods) throw new Error('Selected goods not found');
        
        productSku = selectedGoods.sku;
        productName = selectedGoods.sku;
      } else {
        productSku = validatedData.sku!;
        productName = validatedData.product_name!;
      }

      // First, ensure we have a warehouse product for this material
      const { data: existingProduct } = await supabase
        .from('warehouse_products')
        .select('id')
        .eq('sku', productSku)
        .maybeSingle();

      productId = existingProduct?.id;

      if (!existingProduct) {
        // Create warehouse product
        const productData = {
          sku: productSku,
          name: productName,
          weight_kg: validatedData.weight_kg / validatedData.quantity // weight per unit
        };

        // Only add barcode for non-"other" stock types
        if (validatedData.stock_type !== 'other_stock') {
          (productData as any).barcode = productSku;
        }

        const { data: newProduct, error: createProductError } = await supabase
          .from('warehouse_products')
          .insert(productData)
          .select('id')
          .single();

        if (createProductError) throw createProductError;
        productId = newProduct.id;
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('warehouse_stock_movements')
        .insert({
          product_id: productId,
          goods_received_id: validatedData.stock_type === 'qc_approved' ? validatedData.goods_received_id : null,
          to_slot_code: validatedData.to_slot_code,
          quantity: validatedData.quantity,
          weight_kg: validatedData.weight_kg,
          notes: validatedData.notes,
          performed_by: user?.id,
          movement_type: 'IN'
        });

      if (movementError) throw movementError;

      // Update slot inventory
      const { data: existingInventory } = await supabase
        .from('warehouse_slot_inventory')
        .select('quantity')
        .eq('slot_code', validatedData.to_slot_code)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('warehouse_slot_inventory')
          .update({
            quantity: existingInventory.quantity + validatedData.quantity
          })
          .eq('slot_code', validatedData.to_slot_code)
          .eq('product_id', productId);
        
        if (updateError) throw updateError;
      } else {
        // Create new inventory record
        const { error: insertError } = await supabase
          .from('warehouse_slot_inventory')
          .insert({
            slot_code: validatedData.to_slot_code,
            product_id: productId,
            quantity: validatedData.quantity
          });
        
        if (insertError) throw insertError;
      }

      // Update goods_received warehouse status (only for QC approved goods)
      if (validatedData.stock_type === 'qc_approved' && selectedGoods) {
        const newQuantityMoved = selectedGoods.warehouse_quantity_moved + validatedData.quantity;
        const newStatus = newQuantityMoved >= selectedGoods.quantity_received ? 'completed' : 'partial';

        const { error: statusError } = await supabase
          .from('goods_received')
          .update({
            warehouse_quantity_moved: newQuantityMoved,
            warehouse_status: newStatus
          })
          .eq('id', validatedData.goods_received_id!);

        if (statusError) throw statusError;
      }

      // Reset form
      setFormData({
        stock_type: 'qc_approved' as StockType,
        quantity: 0,
        weight_kg: 0,
        goods_received_id: '',
        sku: '',
        product_name: '',
        description: '',
        invoice: '',
        po: '',
        to_slot_code: '',
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
        setErrors({ general: error instanceof Error ? error.message : 'Failed to record goods receipt. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-green-600" />
            Warehouse Goods In
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

          {/* Stock Type Selection */}
          <div className="space-y-2">
            <Label>Stock Type *</Label>
            <Select value={formData.stock_type} onValueChange={(value: StockType) => setFormData(prev => ({ ...prev, stock_type: value, goods_received_id: '', sku: '', product_name: '', description: '', po: '' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qc_approved">QC Approved Goods</SelectItem>
                <SelectItem value="other_stock">Other Stock</SelectItem>
                <SelectItem value="finished_goods">Finished Goods</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.stock_type === 'qc_approved' ? (
            <div className="space-y-4">
              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Filter by Invoice</Label>
                  <Select value={searchFilter.invoice} onValueChange={(value) => setSearchFilter(prev => ({ ...prev, invoice: value }))}>
                    <SelectTrigger className="h-8 bg-background border border-input">
                      <SelectValue placeholder="All invoices" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All invoices</SelectItem>
                      {availableInvoices.map((invoice) => (
                        <SelectItem key={invoice} value={invoice}>
                          {invoice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Filter by Pallet</Label>
                  <Input
                    placeholder="Search pallet number..."
                    value={searchFilter.pallet}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, pallet: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Filter by SKU</Label>
                  <Select value={searchFilter.sku} onValueChange={(value) => setSearchFilter(prev => ({ ...prev, sku: value }))}>
                    <SelectTrigger className="h-8 bg-background border border-input">
                      <SelectValue placeholder="All SKUs" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All SKUs</SelectItem>
                      {availableSkus.map((sku) => (
                        <SelectItem key={sku} value={sku}>
                          {sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* QC Approved Goods Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Available QC Approved Items ({filteredQcGoods.length})</Label>
                  {(searchFilter.invoice !== 'all' || searchFilter.pallet || searchFilter.sku !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSearchFilter({ invoice: 'all', pallet: '', sku: 'all' })}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b sticky top-0">
                        <tr>
                          <th className="text-left p-2">Select</th>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-left p-2 font-semibold text-primary">Invoice</th>
                          <th className="text-left p-2">Material</th>
                          <th className="text-left p-2">Supplier</th>
                          <th className="text-left p-2 font-semibold text-primary">Pallet #</th>
                          <th className="text-left p-2">Received</th>
                          <th className="text-left p-2">Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQcGoods.map((goods) => {
                          const availableQty = goods.quantity_received - goods.warehouse_quantity_moved;
                          const isSelected = formData.goods_received_id === goods.id;
                          return (
                            <tr 
                              key={goods.id} 
                              className={`border-b hover:bg-muted/30 cursor-pointer ${isSelected ? 'bg-primary/10' : ''} ${availableQty <= 0 ? 'opacity-50' : ''}`}
                              onClick={() => availableQty > 0 && setFormData(prev => ({ ...prev, goods_received_id: goods.id }))}
                            >
                              <td className="p-2">
                                <input 
                                  type="radio" 
                                  checked={isSelected}
                                  onChange={() => setFormData(prev => ({ ...prev, goods_received_id: goods.id }))}
                                  disabled={availableQty <= 0}
                                />
                              </td>
                              <td className="p-2 font-medium">{goods.sku}</td>
                              <td className="p-2">
                                {goods.invoice ? (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {goods.invoice}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-2">{goods.sku}</td>
                              <td className="p-2 text-xs">{goods.supplier}</td>
                              <td className="p-2">
                                {goods.pallet_number ? (
                                  <Badge variant="secondary" className="font-mono">
                                    #{goods.pallet_number}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-2 text-xs text-muted-foreground">
                                {new Date(goods.received_date).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                <Badge variant={availableQty > 0 ? "default" : "outline"}>
                                  {availableQty}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredQcGoods.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                              {qcApprovedGoods.length === 0 ? 'No QC approved goods available' : 'No items match your search criteria'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {errors.goods_received_id && <p className="text-sm text-destructive">{errors.goods_received_id}</p>}
                
                {/* Selected Item Details */}
                {selectedGoods && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="font-medium text-sm mb-2">Selected Item Details:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">SKU:</span>
                        <div className="font-medium">{selectedGoods.sku}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Invoice:</span>
                        <div className="font-medium">{selectedGoods.invoice || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pallet:</span>
                        <div className="font-medium">{selectedGoods.pallet_number ? `#${selectedGoods.pallet_number}` : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Available:</span>
                        <div className="font-medium text-primary">{availableQuantity}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* For other_stock, only show Product Name */}
              {formData.stock_type === 'other_stock' ? (
                <>
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                    {errors.product_name && <p className="text-sm text-destructive">{errors.product_name}</p>}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* SKU Selection */}
                  <div className="space-y-2">
                    <Label>SKU *</Label>
                    <Select value={formData.sku} onValueChange={(value) => {
                      const selectedProduct = products.find(p => p.product_code === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        sku: value,
                        product_name: selectedProduct?.product_name || ''
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SKU" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.product_code}>
                            {product.product_code} - {product.product_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                  </div>

                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                    {errors.product_name && <p className="text-sm text-destructive">{errors.product_name}</p>}
                  </div>

                  {/* Conditional fields based on stock type */}
                  {formData.stock_type === 'finished_goods' ? (
                    <div className="space-y-2">
                      <Label>P.O *</Label>
                      <Input
                        value={formData.po}
                        onChange={(e) => setFormData(prev => ({ ...prev, po: e.target.value }))}
                        placeholder="Enter P.O number"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Invoice</Label>
                      <Input
                        value={formData.invoice}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoice: e.target.value }))}
                        placeholder="Enter invoice number"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min="1"
                max={formData.stock_type === 'qc_approved' ? availableQuantity : undefined}
                required
              />
              {formData.stock_type === 'qc_approved' && availableQuantity > 0 && (
                <p className="text-xs text-muted-foreground">
                  Maximum available: {availableQuantity}
                </p>
              )}
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label>Total Weight (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || 0 }))}
                min="0.1"
                required
                placeholder="Enter total weight"
              />
              <p className="text-xs text-muted-foreground">
                Total weight for all {formData.quantity} units
              </p>
              {errors.weight_kg && <p className="text-sm text-destructive">{errors.weight_kg}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">

            {/* Destination Slot */}
            <div className="space-y-2">
              <Label>Destination Slot *</Label>
              <Select value={formData.to_slot_code} onValueChange={(value) => setFormData(prev => ({ ...prev, to_slot_code: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots?.map((slot) => (
                    <SelectItem key={slot.slot_code} value={slot.slot_code}>
                      {slot.slot_code} (Capacity: {slot.capacity_units})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.to_slot_code && <p className="text-sm text-destructive">{errors.to_slot_code}</p>}
              
              {/* Weight Validation Feedback */}
              {weightValidation && (
                <div className={`p-3 rounded-lg border ${
                  weightValidation.isValid 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4" />
                    <span className="font-medium text-sm">Bay Weight Check</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Current weight:</span>
                      <span className="font-mono">{weightValidation.currentWeight.toFixed(1)}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adding:</span>
                      <span className="font-mono">+{formData.weight_kg.toFixed(1)}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New total:</span>
                      <span className="font-mono">{weightValidation.newWeight.toFixed(1)}kg</span>
                    </div>
                    {weightValidation.maxWeight > 0 && (
                      <div className="flex justify-between">
                        <span>Bay limit:</span>
                        <span className="font-mono">{weightValidation.maxWeight.toFixed(1)}kg</span>
                      </div>
                    )}
                    {!weightValidation.isValid && weightValidation.errorMessage && (
                      <div className="mt-2 font-medium">{weightValidation.errorMessage}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this goods receipt..."
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
                  <Package className="w-4 h-4" />
                  Record Goods In
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoodsInForm;