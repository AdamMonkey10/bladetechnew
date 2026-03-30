import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useDataQuality } from '@/hooks/useDataQuality';
import { AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react';

export function DataQualityPanel() {
  const { isFixing, corrections, metrics, fixMissingHours, getDataQualityMetrics } = useDataQuality();
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    getDataQualityMetrics();
  }, []);

  const handleFixData = async () => {
    const results = await fixMissingHours();
    if (typeof results === 'number' ? results > 0 : (results as any[])?.length > 0) {
      setShowCorrections(true);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Data Quality Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.total_records}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.records_without_hours}
                </div>
                <div className="text-sm text-muted-foreground">Need Correction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(100 - (metrics.data_completeness || 0)).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Correction Rate</div>
              </div>
            </div>
          )}

          {metrics && metrics.records_without_hours > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {metrics.records_without_hours} records with production data but missing hours. 
                These records will have estimated hours calculated based on average productivity rates.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All production records have valid time data. No corrections needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleFixData} 
              disabled={isFixing || (metrics?.records_with_corrections || 0) === 0}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fixing Data...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Fix Missing Hours
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={getDataQualityMetrics}
            >
              Refresh Metrics
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCorrections && corrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Applied Corrections ({corrections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead className="text-right">Units Produced</TableHead>
                    <TableHead className="text-right">Original Hours</TableHead>
                    <TableHead className="text-right">Estimated Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corrections.slice(0, 10).map((correction, index) => (
                    <TableRow key={`${correction.record_id}-${index}`}>
                      <TableCell>
                        <Badge variant="outline">{correction.activity_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {correction.units_produced.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {correction.original_hours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          {correction.estimated_hours.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Corrected
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {corrections.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Showing first 10 corrections. Total: {corrections.length} records corrected.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}