import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Eye, Download, Calendar } from 'lucide-react';
import { formatDateRange, formatDate } from '@/utils/dateUtils';

interface WeeklyReport {
  id: string;
  week_start_date: string;
  week_end_date: string;
  report_data: any;
  generated_at: string;
  status: string;
}

interface ReportsHistoryProps {
  reports: WeeklyReport[];
}

export function ReportsHistory({ reports }: ReportsHistoryProps) {
  // Using the imported formatDateRange utility

  const getMetricsSummary = (reportData: any) => {
    const production = reportData.production_metrics?.current_week;
    const qc = reportData.qc_metrics;
    const po = reportData.po_metrics;

    return {
      labels: production?.total_labels || 0,
      quantity: production?.total_quantity || 0,
      defectRate: qc?.overall_defect_rate || 0,
      completionRate: po?.completion_rate || 0,
    };
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports History</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reports generated yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generate your first weekly report to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week Period</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Defect Rate</TableHead>
              <TableHead>PO Completion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const metrics = getMetricsSummary(report.report_data);
              
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {formatDateRange(report.week_start_date, report.week_end_date)}
                  </TableCell>
                  <TableCell>
                    {formatDate(report.generated_at, 'dd/MM, h:mm a')}
                  </TableCell>
                  <TableCell>{metrics.labels.toLocaleString()}</TableCell>
                  <TableCell>{metrics.quantity.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      metrics.defectRate > 5 ? 'text-red-600' : 
                      metrics.defectRate > 2 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {metrics.defectRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      metrics.completionRate < 70 ? 'text-red-600' : 
                      metrics.completionRate < 90 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {metrics.completionRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}