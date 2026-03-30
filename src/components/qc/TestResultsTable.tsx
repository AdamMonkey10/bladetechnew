import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, ClipboardList } from 'lucide-react';
import { TestResult } from '@/services/qcApiService';
import { format } from 'date-fns';

interface TestResultsTableProps {
  testResults: TestResult[];
}

export function TestResultsTable({ testResults }: TestResultsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'fail':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTestTypeDisplayName = (testType: string) => {
    return testType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Sort by date (most recent first) - ensure testResults is an array
  const sortedResults = Array.isArray(testResults) 
    ? [...testResults].sort((a, b) => 
        new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Test Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No test results available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sortedResults.filter(r => r.status === 'pass').length}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sortedResults.filter(r => r.status === 'fail').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {sortedResults.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">
                          {getTestTypeDisplayName(result.test_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(new Date(result.test_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(result.test_date), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <Badge variant={getStatusVariant(result.status)}>
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}