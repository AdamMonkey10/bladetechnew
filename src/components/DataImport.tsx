import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  summary: {
    totalRecords: number;
    transformed: number;
    skipped: number;
    imported: number;
    failed: number;
  };
  skippedRecords: Array<{ id: string; reason: string }>;
  batchResults: Array<{
    batch: number;
    status: string;
    recordCount: number;
    error?: string;
  }>;
}

export default function DataImport() {
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any>(null);
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  const analyzeJsonData = (jsonText: string) => {
    if (!jsonText.trim()) {
      setParsedPreview(null);
      setDetectedFormat('');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let records = [];
      let format = '';
      let sampleRecord = null;

      console.log('Raw parsed data:', parsed);

      if (Array.isArray(parsed)) {
        records = parsed;
        format = `Direct array format (${records.length} records)`;
        sampleRecord = records[0];
      } else if (parsed && typeof parsed === 'object') {
        // Check for Firebase export with milwaukeeTestReports
        if (parsed.milwaukeeTestReports && Array.isArray(parsed.milwaukeeTestReports)) {
          records = parsed.milwaukeeTestReports;
          format = `Firebase milwaukeeTestReports format (${records.length} records)`;
          sampleRecord = records[0];
          console.log('Firebase milwaukeeTestReports format detected:', {
            totalRecords: records.length,
            sampleRecord: records[0]
          });
        } else if (parsed.records && Array.isArray(parsed.records)) {
          records = parsed.records;
          format = `Nested records format (${records.length} records)`;
          sampleRecord = records[0];
        } else if (parsed.id || parsed.date || parsed.machine) {
          records = [parsed];
          format = 'Single record format (1 record)';
          sampleRecord = parsed;
        } else {
          // General Firebase-style export with document IDs as keys
          const entries = Object.entries(parsed);
          
          // Check if values are arrays (like milwaukeeTestReports: [...])
          const firstEntry = entries[0];
          if (firstEntry && Array.isArray(firstEntry[1])) {
            // Handle cases like { "milwaukeeTestReports": [...] }
            records = firstEntry[1];
            format = `Firebase collection format: ${firstEntry[0]} (${records.length} records)`;
            sampleRecord = records[0];
          } else {
            // Handle document-based exports: { "docId1": {...}, "docId2": {...} }
            records = entries.map(([key, value]) => {
              if (value && typeof value === 'object') {
                return { id: key, ...value };
              }
              return value;
            }).filter(record => record && typeof record === 'object');
            
            format = `Firebase document export format (${entries.length} documents → ${records.length} records)`;
            sampleRecord = records[0];
            
            console.log('Firebase document format detected:', {
              originalKeys: entries.slice(0, 3).map(([key]) => key),
              sampleDocument: entries[0],
              transformedSample: records[0]
            });
          }
        }
      }

      console.log('Analysis result:', {
        format,
        recordCount: records?.length,
        sampleRecord,
        hasRequiredFields: sampleRecord ? {
          id: !!sampleRecord.id,
          date: !!sampleRecord.date,
          machine: !!sampleRecord.machine,
          operator: !!sampleRecord.operator,
          sku: !!sampleRecord.sku
        } : null
      });

      setParsedPreview({
        records: records?.slice(0, 3) || [], // Show first 3 records
        totalCount: records?.length || 0,
        sampleRecord
      });
      setDetectedFormat(format);

    } catch (error) {
      console.log('JSON parse error:', error);
      setParsedPreview(null);
      setDetectedFormat(`Invalid JSON: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your JSON data before importing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setResult(null);

      // Parse JSON data
      let records = [];
      try {
        const parsed = JSON.parse(jsonData);
        
        // Handle different JSON formats - use same logic as analyzeJsonData
        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // Check for Firebase export with milwaukeeTestReports
          if (parsed.milwaukeeTestReports && Array.isArray(parsed.milwaukeeTestReports)) {
            records = parsed.milwaukeeTestReports;
          } else if (parsed.records && Array.isArray(parsed.records)) {
            records = parsed.records;
          } else if (parsed.id || parsed.date || parsed.machine) {
            // Single Firebase record - wrap in array
            records = [parsed];
          } else {
            // General Firebase-style export with document IDs as keys
            const entries = Object.entries(parsed);
            
            // Check if values are arrays (like milwaukeeTestReports: [...])
            const firstEntry = entries[0];
            if (firstEntry && Array.isArray(firstEntry[1])) {
              // Handle cases like { "milwaukeeTestReports": [...] }
              records = firstEntry[1];
            } else {
              // Handle document-based exports: { "docId1": {...}, "docId2": {...} }
              records = entries.map(([key, value]) => {
                if (value && typeof value === 'object') {
                  return { id: key, ...value };
                }
                return value;
              }).filter(record => record && typeof record === 'object');
            }
          }
        } else {
          throw new Error('Data must be an array of records or an object containing records');
        }
        
        if (!Array.isArray(records) || records.length === 0) {
          throw new Error('No valid records found. Expected format: array of objects, single record, or Firebase export object');
        }
        
        console.log(`Processed ${records.length} records for import`);
        console.log('Sample processed record:', JSON.stringify(records[0], null, 2));
        
      } catch (parseError) {
        if (parseError.message.includes('Unexpected token')) {
          throw new Error('Invalid JSON format. Please ensure your data is valid JSON.');
        }
        throw new Error(`Parse error: ${parseError.message}`);
      }

      // Call the import function
      const { data, error } = await supabase.functions.invoke('import-historical-data', {
        body: { records }
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${data.summary.imported} out of ${data.summary.totalRecords} records.`,
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
            Import Historical Test Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste your JSON data below:
            </label>
            <Textarea
              placeholder="Paste your Firebase JSON export here..."
              value={jsonData}
              onChange={(e) => {
                setJsonData(e.target.value);
                analyzeJsonData(e.target.value);
              }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          {/* Data Preview */}
          {(detectedFormat || parsedPreview) && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${detectedFormat.includes('Invalid') ? 'text-red-500' : 'text-green-500'}`} />
                  Data Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Detected Format:</strong> {detectedFormat}
                </div>
                
                {parsedPreview && parsedPreview.totalCount > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Total Records:</strong> {parsedPreview.totalCount}</div>
                      <div><strong>Preview:</strong> First {Math.min(3, parsedPreview.totalCount)} records</div>
                    </div>
                    
                    {/* Sample Record Structure */}
                    {parsedPreview.sampleRecord && (
                      <div>
                        <strong>Sample Record Structure:</strong>
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(parsedPreview.sampleRecord).slice(0, 8).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-mono text-blue-600">{key}:</span>
                                <span className="text-muted-foreground truncate ml-2">
                                  {typeof value === 'object' ? 
                                    JSON.stringify(value).substring(0, 30) + '...' : 
                                    String(value).substring(0, 20)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Field Validation */}
                    {parsedPreview.sampleRecord && (
                      <div>
                        <strong>Required Fields Check:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {['id', 'date', 'machine', 'operator', 'sku'].map(field => {
                            const hasField = !!parsedPreview.sampleRecord[field];
                            return (
                              <div key={field} className={`px-2 py-1 rounded text-xs ${
                                hasField ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {field}: {hasField ? '✓' : '✗'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {detectedFormat.includes('Invalid') && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Please check your JSON format. Common issues:
                      <ul className="list-disc list-inside mt-2 text-sm">
                        <li>Missing quotes around strings</li>
                        <li>Trailing commas</li>
                        <li>Unescaped special characters</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
          
          <Button 
            onClick={handleImport} 
            disabled={importing || !jsonData.trim() || detectedFormat.includes('Invalid') || !parsedPreview?.totalCount}
            size="lg"
            className="w-full"
          >
            {importing ? 'Importing...' : `Import ${parsedPreview?.totalCount || 0} Records`}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.summary.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.summary.imported}</div>
                <div className="text-sm text-green-600">Imported</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</div>
                <div className="text-sm text-yellow-600">Skipped</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.summary.transformed}</div>
                <div className="text-sm text-blue-600">Processed</div>
              </div>
            </div>

            {/* Skipped Records */}
            {result.skippedRecords.length > 0 && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Skipped Records ({result.skippedRecords.length})</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.skippedRecords.map((skip, index) => (
                      <div key={index} className="text-sm">
                        <strong>{skip.id}:</strong> {skip.reason}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Batch Results */}
            <div>
              <h4 className="font-medium mb-2">Batch Import Results</h4>
              <div className="space-y-2">
                {result.batchResults.map((batch, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>Batch {batch.batch} ({batch.recordCount} records)</span>
                    <div className="flex items-center gap-2">
                      {batch.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm capitalize">{batch.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}