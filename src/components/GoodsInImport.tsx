import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FirebaseGoodsInRecord {
  id: string;
  notes: string;
  sku: string;
  setLeft2: number;
  goodStatus: boolean;
  setRightAvg: number;
  setRight1: number;
  palletNumber: number;
  height: number;
  setLeftAvg: number;
  setLeft1: number;
  invoice: string;
  dateReceived: {
    seconds: number;
    nanoseconds: number;
  };
  supplier: string;
  setRight2: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  gauge: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export default function GoodsInImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const convertFirebaseTimestamp = (timestamp: { seconds: number; nanoseconds: number }): string => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  const findOrCreateSupplier = async (supplierName: string): Promise<string> => {
    // First try to find existing supplier
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', supplierName)
      .single();

    if (existingSupplier) {
      return existingSupplier.id;
    }

    // Create new supplier if not found
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({ name: supplierName })
      .select('id')
      .single();

    if (error) throw error;
    return newSupplier.id;
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your Firebase goods-in JSON data.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to import data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setResult(null);

      const parsed = JSON.parse(jsonData);
      const records: FirebaseGoodsInRecord[] = parsed.Goodsin || [];

      if (!records.length) {
        throw new Error('No goods-in records found in the provided data.');
      }

      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process each record
      for (const record of records) {
        try {
          // Find or create supplier
          const supplierId = await findOrCreateSupplier(record.supplier);

          // Convert Firebase record to Supabase format
          const supabaseRecord = {
            sku: record.sku,
            pallet_number: record.palletNumber,
            supplier: supplierId,
            invoice: record.invoice,
            notes: record.notes || null,
            height: record.height,
            gauge: record.gauge,
            set_left_1: record.setLeft1,
            set_left_2: record.setLeft2,
            set_right_1: record.setRight1,
            set_right_2: record.setRight2,
            set_left_avg: record.setLeftAvg,
            set_right_avg: record.setRightAvg,
            good_status: record.goodStatus,
            received_date: convertFirebaseTimestamp(record.dateReceived),
            quantity_received: 1, // Default for quality control records
            user_id: user.id
          };

          // Insert record
          const { error } = await supabase
            .from('goods_received')
            .insert(supabaseRecord);

          if (error) {
            failed++;
            errors.push(`Record ${record.id}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (error) {
          failed++;
          errors.push(`Record ${record.id}: ${error.message}`);
        }
      }

      setResult({ success: true, imported, failed, errors });

      toast({
        title: "Import completed",
        description: `Successfully imported ${imported} records. ${failed} failed.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Firebase Goods-In Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste your Firebase JSON data below:
            </label>
            <Textarea
              placeholder='{"Goodsin": [{"id": "...", "sku": "...", ...}]}'
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={importing || !jsonData.trim()}
            size="lg"
            className="w-full"
          >
            {importing ? 'Importing...' : 'Import Goods-In Data'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-green-600">Imported</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Import Errors:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm">{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}