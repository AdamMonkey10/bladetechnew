import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { QualityData, qcApiService } from '@/services/qcApiService';

interface QualitySummaryProps {
  quality: QualityData;
}

export function QualitySummary({ quality }: QualitySummaryProps) {
  // Safety check for quality data
  if (!quality) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Quality Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quality data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'fail':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(quality.overall_status)}
          Quality Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Status:</span>
            <Badge variant={getStatusVariant(quality.overall_status)} className="text-sm">
              {quality.overall_status.toUpperCase()}
            </Badge>
          </div>

          {/* Fault Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Faults:</span>
            <span className="font-semibold text-lg">{quality.fault_count}</span>
          </div>

          {/* Fault Details */}
          {quality.faults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Detected Issues:</h4>
              {quality.faults.map((fault, index) => (
                <Alert key={index} className="py-3">
                  <AlertDescription>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={getSeverityBadgeVariant(fault.severity)}
                            className="text-xs"
                          >
                            {fault.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-sm">{fault.type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{fault.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Position: {fault.position} ft
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {quality.fault_count === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No quality issues detected. Batch meets all specifications.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}