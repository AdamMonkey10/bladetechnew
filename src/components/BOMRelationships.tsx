import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, Package, Package2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductMaterial {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity_required: number;
  notes: string | null;
  products: {
    product_code: string;
    product_name: string;
  };
  raw_materials: {
    material_code: string;
    material_name: string;
  };
}

interface BOMTreeItem {
  product_code: string;
  product_name: string;
  materials: {
    material_code: string;
    material_name: string;
    quantity_required: number;
    notes: string | null;
  }[];
}

export default function BOMRelationships() {
  const { toast } = useToast();
  const [relationships, setRelationships] = useState<ProductMaterial[]>([]);
  const [bomTree, setBomTree] = useState<BOMTreeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<ProductMaterial | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newNotes, setNewNotes] = useState<string>('');

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_materials')
        .select(`
          *,
          products (product_code, product_name),
          raw_materials (material_code, material_name)
        `)
        .order('products(product_code)');

      if (error) throw error;

      setRelationships(data || []);
      buildBOMTree(data || []);
    } catch (error) {
      toast({
        title: "Error loading BOM relationships",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildBOMTree = (data: ProductMaterial[]) => {
    const tree: { [key: string]: BOMTreeItem } = {};

    data.forEach((relationship) => {
      const productCode = relationship.products.product_code;
      
      if (!tree[productCode]) {
        tree[productCode] = {
          product_code: productCode,
          product_name: relationship.products.product_name,
          materials: []
        };
      }

      tree[productCode].materials.push({
        material_code: relationship.raw_materials.material_code,
        material_name: relationship.raw_materials.material_name,
        quantity_required: relationship.quantity_required,
        notes: relationship.notes
      });
    });

    setBomTree(Object.values(tree));
  };

  const handleEditRelationship = (relationship: ProductMaterial) => {
    setEditingRelationship(relationship);
    setNewQuantity(relationship.quantity_required);
    setNewNotes(relationship.notes || '');
    setEditDialogOpen(true);
  };

  const handleUpdateRelationship = async () => {
    if (!editingRelationship) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_materials')
        .update({
          quantity_required: newQuantity,
          notes: newNotes || null
        })
        .eq('id', editingRelationship.id);

      if (error) throw error;

      toast({
        title: "Relationship updated successfully",
        description: "BOM relationship has been updated.",
      });

      setEditDialogOpen(false);
      setEditingRelationship(null);
      loadRelationships();
    } catch (error) {
      toast({
        title: "Error updating relationship",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to delete this BOM relationship?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_materials')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      toast({
        title: "Relationship deleted successfully",
        description: "BOM relationship has been removed.",
      });

      loadRelationships();
    } catch (error) {
      toast({
        title: "Error deleting relationship",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRelationships = relationships.filter(rel =>
    rel.products.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.products.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.raw_materials.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.raw_materials.material_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const incompleteProducts = bomTree.filter(product => product.materials.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">BOM Relationships</h2>
        <p className="text-muted-foreground">View and manage Bill of Materials relationships between products and raw materials</p>
      </div>

      {incompleteProducts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="h-5 w-5" />
              Incomplete BOMs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              The following products don't have any raw materials assigned:
            </p>
            <div className="flex flex-wrap gap-2">
              {incompleteProducts.map((product) => (
                <Badge key={product.product_code} variant="outline" className="border-warning">
                  {product.product_code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* BOM Tree View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            BOM Tree Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bomTree.map((product) => (
              <div key={product.product_code} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{product.product_code}</span>
                  <span className="text-muted-foreground">- {product.product_name}</span>
                  <Badge variant="secondary">{product.materials.length} materials</Badge>
                </div>
                
                {product.materials.length > 0 ? (
                  <div className="ml-6 space-y-2">
                    {product.materials.map((material, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Package2 className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{material.material_code}</span>
                        <span className="text-muted-foreground">- {material.material_name}</span>
                        <Badge variant="outline">Qty: {material.quantity_required}</Badge>
                        {material.notes && (
                          <Badge variant="secondary" className="text-xs">
                            {material.notes}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-6 text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    No raw materials assigned
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Relationships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Material Code</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell className="font-medium">
                      {relationship.products.product_code}
                    </TableCell>
                    <TableCell>{relationship.products.product_name}</TableCell>
                    <TableCell className="font-medium">
                      {relationship.raw_materials.material_code}
                    </TableCell>
                    <TableCell>{relationship.raw_materials.material_name}</TableCell>
                    <TableCell>{relationship.quantity_required}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {relationship.notes || 'No notes'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRelationship(relationship)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRelationship(relationship.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Edit Relationship Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit BOM Relationship</DialogTitle>
            <DialogDescription>
              Update the relationship details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Product:</strong> {editingRelationship?.products.product_code}
              </div>
              <div className="text-sm">
                <strong>Material:</strong> {editingRelationship?.raw_materials.material_code}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Required</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRelationship} disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}