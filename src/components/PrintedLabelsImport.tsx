import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useImportPrintedLabels } from '@/hooks/usePrintedLabels';
import { useAuth } from '@/hooks/useAuth';
import { useGenerateBoxNumber } from '@/hooks/useBoxNumber';

interface PrintedLabelsImportProps {
  onClose: () => void;
}

export function PrintedLabelsImport({ onClose }: PrintedLabelsImportProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [jsonData, setJsonData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const importPrintedLabels = useImportPrintedLabels();
  const generateBoxNumber = useGenerateBoxNumber();

  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import data",
        variant: "destructive",
      });
      return;
    }

    if (!jsonData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your JSON data before importing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      const parsedData = JSON.parse(jsonData);
      console.log('Parsed Firebase data:', parsedData);
      
      let data: any[];
      
      // Handle different Firebase export formats
      if (Array.isArray(parsedData)) {
        // Already an array
        data = parsedData;
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Check if it's wrapped in a collection (like {"LabelBoxes": {...}})
        const possibleCollections = ['LabelBoxes', 'labelBoxes', 'printed_labels'];
        let foundCollection = false;
        
        for (const collectionName of possibleCollections) {
          if (parsedData[collectionName]) {
            console.log(`Found collection: ${collectionName}`);
            const collectionData = parsedData[collectionName];
            data = Object.entries(collectionData).map(([key, value]: [string, any]) => ({
              id: key,
              ...value
            }));
            foundCollection = true;
            break;
          }
        }
        
        if (!foundCollection) {
          // Firebase object format - convert to array
          data = Object.entries(parsedData).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
        }
      } else {
        throw new Error('Data must be either an array of records or a Firebase object export');
      }
      
      console.log(`Processing ${data.length} records`);
      
      if (data.length === 0) {
        throw new Error('No data found to import');
      }

      // Helper function to convert Firebase timestamp to date string
      const convertFirebaseTimestamp = (timestamp: any): string => {
        if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
          return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
        }
        return timestamp || new Date().toISOString().split('T')[0];
      };

      // Transform Firebase LabelBoxes data to match our table structure
      const transformedData = await Promise.all(
        data.map(async (item: any, index: number) => {
          console.log(`Processing record ${index + 1}:`, item);
          
          // Generate box number for each record
          const boxNumber = await generateBoxNumber.mutateAsync();
          
          return {
            document_id: item.id,
            customer: item.customer || '',
            po: item.po || item.PO || '', // Handle both po and PO fields
            sku: item.SKU || item.sku || '',
            operator: item.operator || '',
            laser: item.laser || '',
            invoice: item.invoice || null,
            quantity: parseInt(item.quantity) || 0,
            pallet_name: item.palletName || item.pallet_name || null,
            print_date: convertFirebaseTimestamp(item.createdAt) || item.date || new Date().toISOString().split('T')[0],
            box_number: boxNumber,
            user_id: user.id,
          };
        })
      );

      await importPrintedLabels.mutateAsync(transformedData);

      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.length} printed label records`,
      });
      
      setJsonData('');
      onClose();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="jsonData">Firebase LabelBoxes JSON Data</Label>
        <Textarea
          id="jsonData"
          placeholder="Paste your Firebase LabelBoxes JSON export here..."
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          className="min-h-[300px] font-mono text-sm mt-2"
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p><strong>Expected format:</strong> Array of LabelBoxes objects with fields like:</p>
        <code className="text-xs">
          {`[{"id": "...", "customer": "...", "po": "...", "SKU": "...", "operator": "...", "laser": "...", "quantity": 100, "date": "2025-01-01", "palletName": "..."}]`}
        </code>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !jsonData.trim()}
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
      </div>
    </div>
  );
}