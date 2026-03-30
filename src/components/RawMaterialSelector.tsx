import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Package, Calendar, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface RawMaterialBatch {
  id: string;
  invoice: string;
  pallet_number: number;
  received_date: string;
  good_status: boolean;
  height: number;
  gauge: number;
  set_left_1: number;
  set_left_2: number;
  set_right_1: number;
  set_right_2: number;
  set_left_avg: number;
  set_right_avg: number;
  supplier: string;
  sku: string;
  quantity_received: number;
}

interface RawMaterialSelectorProps {
  productId: string;
  selectedBatchId?: string;
  onBatchSelect: (batchId: string) => void;
}

export default function RawMaterialSelector({ 
  productId, 
  selectedBatchId, 
  onBatchSelect 
}: RawMaterialSelectorProps) {
  const [rawMaterialBatches, setRawMaterialBatches] = useState<RawMaterialBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadRawMaterialBatches();
    } else {
      setRawMaterialBatches([]);
    }
  }, [productId]);

  const loadRawMaterialBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get required raw materials for the selected product
      const { data: productMaterials, error: pmError } = await supabase
        .from('product_materials')
        .select(`
          raw_material_id,
          raw_materials:raw_material_id (
            material_code,
            material_name
          )
        `)
        .eq('product_id', productId);

      if (pmError) throw pmError;

      if (!productMaterials || productMaterials.length === 0) {
        setRawMaterialBatches([]);
        return;
      }

      // Get all material codes for this product
      const materialCodes = productMaterials.map(pm => pm.raw_materials?.material_code).filter(Boolean);

      // Get available batches for these raw materials (matching by SKU/material code)
      const { data: batches, error: batchError } = await supabase
        .from('goods_received')
        .select('*')
        .in('sku', materialCodes)
        .eq('good_status', true) // Only active batches
        .order('received_date', { ascending: false });

      if (batchError) throw batchError;

      setRawMaterialBatches(batches || []);
    } catch (error) {
      console.error('Error loading raw material batches:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Raw Material Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading available raw material batches...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Error Loading Raw Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button onClick={loadRawMaterialBatches} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rawMaterialBatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Raw Material Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No active raw material batches available for this product.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Check if raw materials are properly linked to this product.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Select Raw Material Batch
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the raw material batch being used for this QC test
        </p>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedBatchId} 
          onValueChange={onBatchSelect}
          className="space-y-4"
        >
          {rawMaterialBatches.map((batch) => (
            <div key={batch.id} className="flex items-start space-x-3">
              <RadioGroupItem value={batch.id} id={batch.id} className="mt-1" />
              <Label htmlFor={batch.id} className="flex-1 cursor-pointer">
                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Invoice: {batch.invoice || 'N/A'}</span>
                    </div>
                    <Badge variant={batch.good_status ? "default" : "secondary"}>
                      {batch.good_status ? 'Active' : 'Complete'}
                    </Badge>
                  </div>
                  
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Pallet: {batch.pallet_number || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {batch.received_date ? format(new Date(batch.received_date), 'dd/MM/yyyy') : 'N/A'}
                    </div>
                    <div>
                      Qty: {batch.quantity_received}
                    </div>
                  </div>


                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}