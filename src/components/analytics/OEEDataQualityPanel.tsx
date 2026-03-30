import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useDataQuality } from '@/hooks/useDataQuality';
import { useToast } from '@/hooks/use-toast';

interface OEEDataQualityPanelProps {
  className?: string;
}

export const OEEDataQualityPanel: React.FC<OEEDataQualityPanelProps> = ({ className }) => {
  const { metrics, corrections, isFixing, fixMissingHours, getDataQualityMetrics } = useDataQuality();
  const { toast } = useToast();

  const handleRefreshMetrics = async () => {
    await getDataQualityMetrics();
    toast({
      title: "Metrics Refreshed",
      description: "Data quality metrics updated",
    });
  };

  const handleFixMissingData = async () => {
    const result = await fixMissingHours();
    const count = typeof result === 'number' ? result : Array.isArray(result) ? result.length : 0;
    if (count > 0) {
      toast({
        title: "Data Fixed",
        description: `Fixed ${count} records with missing hours`,
      });
    }
  };

  React.useEffect(() => {
    getDataQualityMetrics();
  }, []);

  const getQualityStatus = () => {
    if (!metrics) return { variant: 'outline' as const, icon: RefreshCw, text: 'Loading...' };
    
    const correctionRate = 100 - (metrics?.data_completeness || 100);
    if (correctionRate === 0) {
      return { variant: 'default' as const, icon: CheckCircle, text: 'Excellent' };
    } else if (correctionRate < 10) {
      return { variant: 'secondary' as const, icon: AlertTriangle, text: 'Good' };
    } else {
      return { variant: 'destructive' as const, icon: AlertTriangle, text: 'Needs Attention' };
    }
  };

  const status = getQualityStatus();
  const StatusIcon = status.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              Data Quality
            </CardTitle>
            <CardDescription>
              Monitor and improve OEE data completeness
            </CardDescription>
          </div>
          <Badge variant={status.variant}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.total_records}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(100 - (metrics?.data_completeness || 100)).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Need Correction</div>
            </div>
          </div>
        )}

        {metrics && (100 - (metrics.data_completeness || 100)) > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {metrics.records_without_hours} records have missing or incomplete data that could affect OEE calculations.
            </AlertDescription>
          </Alert>
        )}

        {corrections.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Corrections</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {corrections.slice(0, 5).map((correction, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {correction.activity_type}: {correction.units_produced} units, 
                  estimated {correction.estimated_hours.toFixed(2)}h
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshMetrics}
            disabled={isFixing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {metrics && (100 - (metrics.data_completeness || 100)) > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFixMissingData}
              disabled={isFixing}
            >
              {isFixing ? 'Fixing...' : 'Fix Missing Data'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};