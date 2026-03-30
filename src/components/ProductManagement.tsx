import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Package, Link, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ProductSpecificationsDialog from './ProductSpecificationsDialog';

const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  box_amount: z.number().min(1, 'Box amount must be positive'),
  revision: z.string().min(1, 'Revision is required'),
  packing_instructions: z.string().optional()
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string | null;
  box_amount: number | null;
  revision: string | null;
  packing_instructions: string | null;
  created_at: string;
}

interface RawMaterial {
  id: string;
  material_code: string;
  material_name: string;
}

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<string>('');
  const [quantityRequired, setQuantityRequired] = useState<number>(1);
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [productMaterials, setProductMaterials] = useState<any[]>([]);
  const [showMaterialsInForm, setShowMaterialsInForm] = useState<boolean>(false);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [selectedProductForSpecs, setSelectedProductForSpecs] = useState<Product | null>(null);
  const [specPromptOpen, setSpecPromptOpen] = useState(false);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      box_amount: 100,
      revision: '1.0'
    }
  });

  useEffect(() => {
    loadProducts();
    loadRawMaterials();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_code');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadRawMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('material_code');
      
      if (error) throw error;
      setRawMaterials(data || []);
    } catch (error) {
      toast({
        title: "Error loading raw materials",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      setLoading(true);

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Product updated successfully",
          description: `${data.product_code} has been updated.`,
        });
      } else {
        const { data: insertedData, error } = await supabase
          .from('products')
          .insert([{
            product_code: data.product_code,
            product_name: data.product_name,
            description: data.description || null,
            box_amount: data.box_amount,
            revision: data.revision,
            packing_instructions: data.packing_instructions || null
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Product created successfully",
          description: `${data.product_code} has been created.`,
        });

        // Store newly created product and prompt for specifications
        setNewlyCreatedProduct(insertedData);
        setSpecPromptOpen(true);
      }

      reset();
      setEditingProduct(null);
      setDialogOpen(false);
      if (editingProduct) {
        loadProducts();
      }
    } catch (error) {
      toast({
        title: "Error saving product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue('product_code', product.product_code);
    setValue('product_name', product.product_name);
    setValue('description', product.description || '');
    setValue('box_amount', product.box_amount || 100);
    setValue('revision', product.revision || '1.0');
    setValue('packing_instructions', product.packing_instructions || '');
    setDialogOpen(true);
  };

  const loadProductMaterials = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_materials')
        .select(`
          *,
          raw_materials (material_code, material_name)
        `)
        .eq('product_id', productId);

      if (error) throw error;
      setProductMaterials(data || []);
    } catch (error) {
      console.error('Error loading product materials:', error);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedProduct || !selectedRawMaterial) return;

    // Check for duplicate materials
    const existingMaterial = productMaterials.find(pm => pm.raw_material_id === selectedRawMaterial);
    if (existingMaterial) {
      toast({
        title: "Material already exists",
        description: "This raw material is already linked to this product.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('product_materials')
        .insert([{
          product_id: selectedProduct.id,
          raw_material_id: selectedRawMaterial,
          quantity_required: quantityRequired,
          notes: 'Added via product management'
        }]);

      if (error) throw error;

      toast({
        title: "Material added successfully",
        description: `Raw material linked to ${selectedProduct.product_code}.`,
      });

      setSelectedRawMaterial('');
      setQuantityRequired(1);
      setMaterialSearch('');
      loadProductMaterials(selectedProduct.id);
    } catch (error) {
      toast({
        title: "Error adding material",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('product_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Material removed successfully",
        description: "Raw material has been unlinked from the product.",
      });

      if (selectedProduct) {
        loadProductMaterials(selectedProduct.id);
      }
    } catch (error) {
      toast({
        title: "Error removing material",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    reset();
    setDialogOpen(true);
  };

  const handleSpecPromptResponse = (addSpecs: boolean) => {
    setSpecPromptOpen(false);
    if (addSpecs && newlyCreatedProduct) {
      setSelectedProductForSpecs(newlyCreatedProduct);
      setSpecDialogOpen(true);
    } else {
      setNewlyCreatedProduct(null);
      loadProducts();
    }
  };

  const handleSpecDialogClose = (open: boolean) => {
    setSpecDialogOpen(open);
    if (!open && newlyCreatedProduct) {
      setNewlyCreatedProduct(null);
      loadProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground">Manage products and their Bill of Materials</p>
        </div>
        <Button onClick={handleNewProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Product Code</TableHead>
                   <TableHead>Product Name</TableHead>
                   <TableHead>Revision</TableHead>
                   <TableHead>Box Amount</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                   <TableRow key={product.id}>
                     <TableCell className="font-medium">{product.product_code}</TableCell>
                     <TableCell>{product.product_name}</TableCell>
                     <TableCell>{product.revision || '1.0'}</TableCell>
                     <TableCell>{product.box_amount || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProductForSpecs(product);
                            setSpecDialogOpen(true);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            loadProductMaterials(product.id);
                            setBomDialogOpen(true);
                          }}
                        >
                          <Link className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product information below.' 
                : 'Enter the details for the new product.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  {...register('product_code')}
                  placeholder="e.g., CPPL200.1"
                />
                {errors.product_code && (
                  <p className="text-sm text-destructive">{errors.product_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="revision">Revision *</Label>
                <Input
                  {...register('revision')}
                  placeholder="e.g., 1.0"
                />
                {errors.revision && (
                  <p className="text-sm text-destructive">{errors.revision.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                {...register('product_name')}
                placeholder="e.g., Circular Saw Blade"
              />
              {errors.product_name && (
                <p className="text-sm text-destructive">{errors.product_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...register('description')}
                placeholder="Product description..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packing_instructions">Packing Instructions</Label>
              <Textarea
                {...register('packing_instructions')}
                placeholder="Instructions for packing this product..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="box_amount">Box Amount *</Label>
              <Input
                {...register('box_amount', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="100"
              />
              {errors.box_amount && (
                <p className="text-sm text-destructive">{errors.box_amount.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* BOM Dialog */}
      <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Raw Material</DialogTitle>
            <DialogDescription>
              Link a raw material to {selectedProduct?.product_code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search for materials */}
            <div className="space-y-2">
              <Label htmlFor="material_search">Search Materials</Label>
              <div className="relative">
                <Input
                  placeholder="Search by code or name..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw_material">Raw Material *</Label>
              <Select value={selectedRawMaterial} onValueChange={setSelectedRawMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Select raw material" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials
                    .filter(material => 
                      !materialSearch || 
                      material.material_code.toLowerCase().includes(materialSearch.toLowerCase()) ||
                      material.material_name.toLowerCase().includes(materialSearch.toLowerCase())
                    )
                    .map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.material_code} - {material.material_name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Required</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={quantityRequired}
                onChange={(e) => setQuantityRequired(parseFloat(e.target.value) || 1)}
              />
            </div>

            {/* Show existing materials for this product */}
            {selectedProduct && productMaterials.length > 0 && (
              <div className="space-y-2">
                <Label>Current Materials</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {productMaterials.map((pm) => (
                    <div key={pm.id} className="text-xs p-2 bg-muted rounded flex justify-between items-center">
                      <span>{pm.raw_materials.material_code} (Qty: {pm.quantity_required})</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMaterial(pm.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBomDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMaterial} 
                disabled={loading || !selectedRawMaterial}
              >
                {loading ? 'Adding...' : 'Add Material'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Specification Prompt Dialog */}
      <Dialog open={specPromptOpen} onOpenChange={setSpecPromptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Specifications?</DialogTitle>
            <DialogDescription>
              Product created successfully! Would you like to add specifications for {newlyCreatedProduct?.product_code} now?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSpecPromptResponse(false)}
            >
              Skip for Now
            </Button>
            <Button onClick={() => handleSpecPromptResponse(true)}>
              Yes, Add Specifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Specifications Dialog */}
      <ProductSpecificationsDialog
        product={selectedProductForSpecs}
        open={specDialogOpen}
        onOpenChange={handleSpecDialogClose}
      />
    </div>
  );
}