import { useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { CSVShiftImport } from './CSVShiftImport';

interface ImportResults {
  imported: number;
  skipped: number;
  errors: string[];
}

interface ShiftDataImportProps {
  onSuccess: () => void;
}

export function ShiftDataImport({ onSuccess }: ShiftDataImportProps) {
  const [jsonData, setJsonData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const { toast } = useToast();

  const parseFirebaseData = (jsonText: string) => {
    const parsed = JSON.parse(jsonText);
    let records = [];
    
    // Handle different Firebase export formats
    if (Array.isArray(parsed)) {
      records = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Handle Firebase document export (key-value pairs)
      records = Object.entries(parsed).map(([key, value]) => {
        if (value && typeof value === 'object') {
          return { firebaseId: key, ...value };
        }
        return value;
      }).filter(record => record && typeof record === 'object');
    }
    
    return records;
  };

  const validateFirebaseRecord = (record: any, index: number): string[] => {
    const errors = [];
    const warnings = [];
    
    // Check for Firebase timestamp
    if (!record.date) {
      errors.push(`Record ${index + 1}: Missing date field`);
    } else if (record.date.seconds === undefined && !record.date.toDate && typeof record.date !== 'string') {
      errors.push(`Record ${index + 1}: Invalid date format (expected Firebase timestamp or ISO string)`);
    }
    
    // Check required fields
    if (!record.shift) errors.push(`Record ${index + 1}: Missing shift field`);
    if (!record.timeStart) errors.push(`Record ${index + 1}: Missing timeStart field`);
    if (!record.timeFinish) errors.push(`Record ${index + 1}: Missing timeFinish field`);
    
    // Check for activities/subcollections
    if (!record.activities || Object.keys(record.activities || {}).length === 0) {
      warnings.push(`Record ${index + 1}: No activities found - production data will be empty`);
    }
    
    return [...errors, ...warnings];
  };

  const handlePreview = () => {
    try {
      const records = parseFirebaseData(jsonData);
      const validationErrors: string[] = [];
      
      // Validate first few records
      records.slice(0, 5).forEach((record, index) => {
        const errors = validateFirebaseRecord(record, index);
        validationErrors.push(...errors);
      });
      
      setPreviewData(records.slice(0, 5));
      
      if (validationErrors.length > 0) {
        toast({
          title: "Data Validation Warnings",
          description: `Found ${records.length} records, but some have validation issues. Check preview below.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Data Preview Ready",
          description: `Found ${records.length} valid Firebase shift records`,
        });
      }
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: `Parse error: ${error.message}. Ensure your data is valid JSON.`,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste your shift data first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const records = parseFirebaseData(jsonData);
      
      if (records.length === 0) {
        throw new Error('No valid records found in the provided data');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Sending Firebase records for import:', records.length);

      const { data, error } = await supabase.functions.invoke('import-shift-data', {
        body: {
          shiftData: records,
          userId: user.id,
        },
      });

      if (error) throw error;

      setImportResults(data.results);
      
      if (data.results.imported > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${data.results.imported} shift records`,
        });
        onSuccess();
      } else {
        toast({
          title: "Import Warning", 
          description: "No records were imported. Check the results below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setJsonData('');
    setPreviewData(null);
    setImportResults(null);
  };

  return (
    <Tabs defaultValue="firebase" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="firebase">Firebase JSON</TabsTrigger>
        <TabsTrigger value="csv">CSV Import</TabsTrigger>
      </TabsList>

      <TabsContent value="firebase" className="space-y-6">
        <div className="space-y-6">
          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Import shift data from your Firebase export. Paste the JSON data below, preview it to verify the format, 
              then click import to add the records to your database. The system will automatically map operators and 
              calculate production totals from activity subcollections.
            </AlertDescription>
          </Alert>

          {/* Missing Activities Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> If your Firebase export doesn't include activity subcollections (like Laser1, Welder, etc.), 
              production data will be empty. Make sure to export both main documents AND their subcollections from Firebase. 
              Use a custom script or Firebase Admin SDK to fetch complete data including subcollections.
            </AlertDescription>
          </Alert>

          {/* Data Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Firebase JSON Data Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">JSON Data</label>
                <Textarea
                  placeholder="Paste your Firebase shift data JSON here..."
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handlePreview} variant="outline" disabled={!jsonData.trim()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Data
                </Button>
                <Button onClick={handleImport} disabled={!jsonData.trim() || isImporting}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Processing shift data...</div>
                  <Progress className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Showing first {previewData.length} records. Review the data structure before importing.
                  </p>
                  
                  {previewData.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Record {index + 1}</Badge>
                        {record.date && (
                           <span className="text-sm">
                             Date: {record.date.seconds 
                               ? formatDate(new Date(record.date.seconds * 1000))
                               : formatDate(record.date)}
                           </span>
                        )}
                        {record.shift && <Badge>{record.shift}</Badge>}
                        {record.operator && <span className="text-sm">Operator: {record.operator}</span>}
                        {record.firebaseId && <span className="text-xs text-muted-foreground">ID: {record.firebaseId}</span>}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>Start: {record.timeStart || 'N/A'}</div>
                        <div>End: {record.timeFinish || 'N/A'}</div>
                        <div>Hours Worked: {record.hoursWorked || 0}</div>
                        <div>Hours Booked: {record.hoursBooked || 0}</div>
                      </div>
                      
                      {record.activities && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Activities: </span>
                          {Object.keys(record.activities).map(activity => (
                            <Badge key={activity} variant="secondary" className="mr-1">
                              {activity} ({Array.isArray(record.activities[activity]) ? record.activities[activity]?.length : 0})
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {record.comments && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Comments: {record.comments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {importResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResults.imported > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{importResults.imported}</div>
                    <div className="text-sm text-green-600">Records Imported</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{importResults.skipped}</div>
                    <div className="text-sm text-orange-600">Records Skipped</div>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-destructive mb-2">Import Errors:</h4>
                    <div className="space-y-1">
                      {importResults.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-muted-foreground bg-destructive/5 p-2 rounded">
                          {error}
                        </div>
                      ))}
                      {importResults.errors.length > 10 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {importResults.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="csv" className="space-y-6">
        <CSVShiftImport onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
}