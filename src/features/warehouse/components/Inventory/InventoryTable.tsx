// Inventory management table component
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package,
  Download,
  MoveRight
} from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseStore } from '../../store';
import { useWarehouseEvents } from '../../hooks/useWarehouseEvents';
import ProductModal from './ProductModal';
import TransferDrawer from './TransferDrawer';
import type { Product } from '../../types';

const InventoryTable = () => {
  const repo = useWarehouseRepo();
  const queryClient = useQueryClient();
  const { 
    permissions, 
    setProductModalOpen, 
    isProductModalOpen,
    setTransferDrawerOpen,
    isTransferDrawerOpen
  } = useWarehouseStore();
  const { trackSearch } = useWarehouseEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['warehouse', 'products', searchQuery],
    queryFn: () => repo.listProducts(searchQuery || undefined),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => repo.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'products'] });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    trackSearch(query, products.length);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleTransferProduct = (product: Product) => {
    setSelectedProduct(product);
    setTransferDrawerOpen(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  const exportToCsv = () => {
    const headers = ['SKU', 'Name', 'Barcode', 'Weight (kg)', 'Min Qty', 'Max Qty'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.sku,
        `"${product.name}"`,
        product.barcode || '',
        product.weightKg || '',
        product.minQty || '',
        product.maxQty || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {permissions.canWrite && (
            <Button onClick={handleCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, name, or barcode..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            <Badge variant="outline">
              {products.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <Package className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first product to get started'}
                </p>
              </div>
              {permissions.canWrite && !searchQuery && (
                <Button onClick={handleCreateProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Min/Max Qty</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.barcode || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.weightKg || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.minQty && product.maxQty 
                        ? `${product.minQty} / ${product.maxQty}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {product.attributes?.category && (
                        <Badge variant="secondary">
                          {product.attributes.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {permissions.canWrite && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTransferProduct(product)}>
                              <MoveRight className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals and Drawers */}
      <ProductModal 
        product={selectedProduct}
        open={isProductModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProduct(null);
        }}
      />
      
      <TransferDrawer
        product={selectedProduct}
        open={isTransferDrawerOpen}
        onClose={() => {
          setTransferDrawerOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default InventoryTable;