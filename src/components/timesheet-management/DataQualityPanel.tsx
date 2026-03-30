import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench,
  RefreshCw,
  TrendingUp 
} from "lucide-react";
import { useDataQuality } from "@/hooks/useDataQuality";

export function DataQualityPanel() {
  const { metrics, corrections, isFixing, fixMissingHours, getDataQualityMetrics } = useDataQuality();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    await getDataQualityMetrics();
    setRefreshing(false);
  };

  const handleFixIssues = async () => {
    await fixMissingHours();
    await getDataQualityMetrics();
  };

  const qualityScore = metrics 
    ? Math.round(metrics.data_completeness || 0)
    : 0;

  const getQualityBadge = (score: number) => {
    if (score >= 95) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (score >= 85) return <Badge variant="secondary">Good</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityScore}%</div>
            <div className="mt-2">{getQualityBadge(qualityScore)}</div>
            <Progress value={qualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_records || 0}</div>
            <p className="text-xs text-muted-foreground">Timesheet entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-destructive">
              {metrics?.records_without_hours || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {(100 - (metrics?.data_completeness || 100)).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Quality Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Data Quality Tools
          </CardTitle>
          <CardDescription>
            Automated tools to identify and fix common timesheet data issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Missing Time Allocations</h3>
              <p className="text-sm text-muted-foreground">
                Fix records with production data but no time spent values
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshMetrics}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Scan
              </Button>
              <Button
                onClick={handleFixIssues}
                disabled={isFixing || !metrics?.records_with_corrections}
                size="sm"
              >
                <Wrench className={`h-4 w-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
                {isFixing ? 'Fixing...' : 'Fix Issues'}
              </Button>
            </div>
          </div>

          {metrics?.records_with_corrections === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No data quality issues detected. Your timesheet data is in good shape!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Corrections */}
      {corrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Corrections</CardTitle>
            <CardDescription>
              Latest automatic fixes applied to timesheet data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Units Produced</TableHead>
                  <TableHead>Original Hours</TableHead>
                  <TableHead>Estimated Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.slice(0, 10).map((correction, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {correction.activity_type}
                    </TableCell>
                    <TableCell>{correction.units_produced}</TableCell>
                    <TableCell>
                      <span className="text-destructive">
                        {correction.original_hours}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600">
                        {correction.estimated_hours.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {correction.corrected ? (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Fixed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}