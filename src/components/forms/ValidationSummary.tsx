import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { ValidationResult } from '@/utils/dataValidation';

interface ValidationSummaryProps {
  validationResults: ValidationResult[];
  className?: string;
}

export function ValidationSummary({ validationResults, className }: ValidationSummaryProps) {
  const allErrors = validationResults.flatMap(r => r.errors);
  const allWarnings = validationResults.flatMap(r => r.warnings);
  const hasIssues = allErrors.length > 0 || allWarnings.length > 0;

  if (!hasIssues) {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          All validation checks passed. Your timesheet data looks good!
        </AlertDescription>
      </Alert>
    );
  }

  const getQualityScore = () => {
    const totalIssues = allErrors.length + allWarnings.length;
    if (totalIssues === 0) return 100;
    if (totalIssues <= 2) return 85;
    if (totalIssues <= 5) return 70;
    return 50;
  };

  const qualityScore = getQualityScore();

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge variant="secondary">Fair</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Data Quality Summary
          {getQualityBadge(qualityScore)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="font-medium">Data Quality Score</span>
          <span className="text-2xl font-bold">{qualityScore}%</span>
        </div>

        {/* Errors */}
        {allErrors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Errors ({allErrors.length})</div>
              <ul className="space-y-1">
                {allErrors.map((error, index) => (
                  <li key={index} className="text-sm">• {error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {allWarnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Data Completeness Issues ({allWarnings.length})</div>
              <ul className="space-y-1">
                {allWarnings.slice(0, 5).map((warning, index) => (
                  <li key={index} className="text-sm">• {warning}</li>
                ))}
                {allWarnings.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    ... and {allWarnings.length - 5} more issues
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Tips:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Ensure all production activities have both time and units recorded</li>
            <li>• Check for decimal point errors (e.g., 45 instead of 4.5 hours)</li>
            <li>• Operators can work multiple machines - total time may exceed shift duration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}