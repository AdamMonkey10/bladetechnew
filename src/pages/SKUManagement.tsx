import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Package2, Link } from 'lucide-react';
import ProductManagement from '@/components/ProductManagement';
import RawMaterialManagement from '@/components/RawMaterialManagement';
import BOMRelationships from '@/components/BOMRelationships';

export default function SKUManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SKU Management</h1>
        <p className="text-muted-foreground">
          Manage product SKUs, raw material codes, and their relationships
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="raw-materials" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Raw Materials
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            BOM Relationships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="raw-materials">
          <RawMaterialManagement />
        </TabsContent>

        <TabsContent value="relationships">
          <BOMRelationships />
        </TabsContent>
      </Tabs>
    </div>
  );
}