import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Papa from 'papaparse';

interface CSVRow {
  ShiftID: string;
  Date: string;
  Operator: string;
  Shift: string;
  SKU: string;
  [key: string]: string; // For dynamic activity columns
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: string[];
}

interface CSVShiftImportProps {
  onSuccess: () => void;
}

export function CSVShiftImport({ onSuccess }: CSVShiftImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Clean up headers by removing extra whitespace and empty strings
        return header.trim();
      },
      transform: (value: string) => {
        // Clean up values by removing extra whitespace
        return value.trim();
      },
      complete: (results) => {
        console.log('CSV Parse Results:', {
          errors: results.errors,
          meta: results.meta,
          dataLength: results.data.length,
          firstRow: results.data[0]
        });

        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(err => 
            `Row ${err.row}: ${err.message}`
          ).join('; ');
          
          toast({
            title: "CSV Parse Issues",
            description: `Found ${results.errors.length} parsing issues: ${errorMessages}`,
            variant: "destructive",
          });
          
          // Continue if we still have data despite errors
          if (results.data.length === 0) return;
        }

        const data = results.data as CSVRow[];
        
        // Filter out completely empty rows
        const cleanData = data.filter(row => {
          const values = Object.values(row);
          return values.some(val => val && val.toString().trim() !== '');
        });

        // Log column information for debugging
        if (cleanData.length > 0) {
          const columns = Object.keys(cleanData[0]);
          console.log('CSV Columns:', {
            count: columns.length,
            columns: columns
          });
        }

        setCsvData(cleanData);
        setPreviewData(cleanData.slice(0, 5)); // Show first 5 rows for preview
        
        toast({
          title: "CSV Loaded Successfully",
          description: `Found ${cleanData.length} records with ${Object.keys(cleanData[0] || {}).length} columns. Review the preview below.`,
        });
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        toast({
          title: "File Read Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  const transformCSVToShiftData = (csvRows: CSVRow[]) => {
    return csvRows.map((row, index) => {
      // Create activities object from CSV columns
      const activities: any = {};
      
      // Define activity types and their column patterns
      const activityTypes = ['Laser1', 'Laser2', 'Welder', 'Coating', 'Stacking', 'OperatorActivity'];
      
      activityTypes.forEach(activityType => {
        const unitsCol = `${activityType}_UnitsProduced`;
        const timeCol = `${activityType}_TimeSpent`;
        const scrapCol = `${activityType}_Scrap`;
        
        if (row[unitsCol] || row[timeCol] || row[scrapCol]) {
          activities[activityType] = [{
            UnitsProduced: parseInt(row[unitsCol]) || 0,
            TimeSpent: parseFloat(row[timeCol]) || 0,
            Scrap: parseInt(row[scrapCol]) || 0,
            Sku: row.SKU || ''
          }];
        }
      });

      // Calculate total hours from activities
      const totalTimeSpent = Object.values(activities).reduce((total: number, activityArray: any) => {
        return total + (activityArray[0]?.TimeSpent || 0);
      }, 0);

      return {
        firebaseId: row.ShiftID || `csv-${index}`,
        date: row.Date,
        shift: row.Shift,
        operator: row.Operator,
        timeStart: "08:00", // Default times - could be enhanced
        timeFinish: "16:00",
        hoursWorked: totalTimeSpent,
        hoursBooked: totalTimeSpent,
        activities: activities,
        comments: `Imported from CSV - SKU: ${row.SKU}`
      };
    });
  };

  const validateCSVStructure = (data: CSVRow[]): string[] => {
    const errors: string[] = [];
    const requiredColumns = ['ShiftID', 'Date', 'Operator', 'Shift', 'SKU'];
    
    if (data.length === 0) {
      errors.push('CSV file is empty');
      return errors;
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow).filter(col => col.trim() !== ''); // Filter out empty column names
    
    console.log('CSV Validation:', {
      totalColumns: columns.length,
      columns: columns,
      requiredColumns: requiredColumns
    });
    
    // Check for required columns (case-insensitive)
    requiredColumns.forEach(col => {
      const found = columns.find(csvCol => 
        csvCol.toLowerCase().trim() === col.toLowerCase().trim()
      );
      if (!found) {
        errors.push(`Missing required column: ${col} (available: ${columns.join(', ')})`);
      }
    });

    // Check for activity columns
    const activityColumns = columns.filter(col => 
      col.includes('_UnitsProduced') || col.includes('_TimeSpent') || col.includes('_Scrap')
    );
    
    if (activityColumns.length === 0) {
      errors.push(`No activity columns found. Expected columns like Laser1_UnitsProduced, Welder_TimeSpent, etc. Found columns: ${columns.join(', ')}`);
    } else {
      console.log('Found activity columns:', activityColumns);
    }

    // Check for unexpected number of columns
    const expectedColumnCount = 23; // Based on your CSV structure
    if (columns.length > expectedColumnCount) {
      errors.push(`Found ${columns.length} columns, expected ${expectedColumnCount}. Extra columns may cause issues. All columns: ${columns.join(', ')}`);
    }

    return errors;
  };

  const handleImport = async () => {
    if (!csvData.length) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    // Validate CSV structure 
    const validationErrors = validateCSVStructure(csvData);
    if (validationErrors.length > 0) {
      toast({
        title: "CSV Validation Failed",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // Transform CSV data to shift format
      const transformedRecords = transformCSVToShiftData(csvData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Sending CSV-transformed records for import:', transformedRecords.length);

      const { data, error } = await supabase.functions.invoke('import-shift-data', {
        body: {
          shiftData: transformedRecords,
          userId: user.id,
        },
      });

      if (error) throw error;

      setImportResults(data.results);
      
      if (data.results.imported > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${data.results.imported} shift records from CSV`,
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
      console.error('CSV Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during CSV import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setCsvFile(null);
    setCsvData([]);
    setPreviewData([]);
    setImportResults(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Import shift data from CSV files. Your CSV should contain columns like ShiftID, Date, Operator, Shift, SKU, 
          and activity columns (Laser1_UnitsProduced, Laser1_TimeSpent, Laser1_Scrap, etc.). 
          The system will automatically transform your CSV data into the proper database format.
        </AlertDescription>
      </Alert>

      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1"
            />
          </div>
          
          {csvFile && (
            <div className="text-sm text-muted-foreground">
              File: {csvFile.name} ({csvData.length} records)
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={!csvData.length || isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import CSV Data'}
            </Button>
            <Button onClick={handleClear} variant="outline" disabled={!csvFile}>
              Clear
            </Button>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Processing CSV data...</div>
              <Progress className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSV Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing first {previewData.length} records from your CSV file. 
                Total records: {csvData.length}
              </p>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Activities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => {
                      const activityCols = Object.keys(row).filter(col => 
                        col.includes('_UnitsProduced') || col.includes('_TimeSpent') || col.includes('_Scrap')
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{row.ShiftID}</TableCell>
                          <TableCell>{row.Date}</TableCell>
                          <TableCell>{row.Operator}</TableCell>
                          <TableCell>
                            <Badge variant={row.Shift === 'Day' ? 'default' : 'secondary'}>
                              {row.Shift}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.SKU}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {activityCols.slice(0, 3).map(col => (
                                <Badge key={col} variant="outline" className="text-xs">
                                  {col.split('_')[0]}
                                </Badge>
                              ))}
                              {activityCols.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{activityCols.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.imported > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              CSV Import Results
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
  );
}