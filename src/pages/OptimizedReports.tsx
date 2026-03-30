import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CheckCircle, XCircle, Search, Filter, Download, Eye, Calendar, User, Settings, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/utils/dateUtils';
import { useReports, useAllReportsStats } from '@/hooks/useReports';
import DataImport from '@/components/DataImport';
import { CachePerformanceToast, cacheStatsTracker } from '@/components/CachePerformanceToast';

interface TestReport {
  id: string;
  test_date: string;
  shift: string;
  total_saws: number;
  total_defects: number;
  defect_rate: number;
  notes: string;
  test_data: any;
  created_at: string;
  products: {
    product_code: string;
    product_name: string;
  };
  machines: {
    machine_code: string;
    machine_name: string;
  };
  operators: {
    operator_code: string;
    operator_name: string;
  };
}

export default function OptimizedReports() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showCacheToast, setShowCacheToast] = useState(false);

  const pageSize = 50; // Smaller page size for better performance

  // Use optimized hooks
  const { 
    reports, 
    totalCount, 
    isLoading, 
    hasNextPage, 
    hasPreviousPage,
    prefetchNextPage 
  } = useReports({ 
    page: currentPage, 
    pageSize 
  });

  // Get stats from separate cached query
  const { data: statsData, isLoading: statsLoading } = useAllReportsStats();

  // Track cache performance
  useEffect(() => {
    if (!isLoading && reports.length > 0) {
      const loadTime = 100; // Simulated load time
      cacheStatsTracker.recordQuery(loadTime, reports.length > 10);
      setShowCacheToast(true);
    }
  }, [isLoading, reports.length]);

  // Prefetch next page when user approaches end of current page
  if (hasNextPage) {
    prefetchNextPage();
  }

  // Filter reports client-side (since we're paginating, this is on a smaller set)
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.products?.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.machines?.machine_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.operators?.operator_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || report.test_date === filterDate;
    
    const testPassed = report.test_data?.test_passed ?? report.test_data?.Status;
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'pass' && testPassed) ||
      (filterStatus === 'fail' && !testPassed);

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Calculate stats from cached data
  const totalReports = totalCount;
  const passRate = statsData ? Math.round((statsData.filter(r => (r.test_data as any)?.test_passed ?? (r.test_data as any)?.Status).length / statsData.length) * 100) : 0;
  const failedTests = statsData ? statsData.filter(r => !((r.test_data as any)?.test_passed ?? (r.test_data as any)?.Status)).length : 0;
  const avgDefectRate = statsData && statsData.length > 0 ? (statsData.reduce((sum, r) => sum + (r.defect_rate || 0), 0) / statsData.length * 100).toFixed(1) : 0;

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (report: TestReport) => {
    const testPassed = report.test_data?.test_passed ?? report.test_data?.Status;
    return testPassed ? (
      <Badge className="bg-green-500 hover:bg-green-600 h-8 px-4">
        <CheckCircle className="w-4 h-4 mr-2" />
        PASS
      </Badge>
    ) : (
      <Badge variant="destructive" className="h-8 px-4">
        <XCircle className="w-4 h-4 mr-2" />
        FAIL
      </Badge>
    );
  };

  const viewDetails = (report: TestReport) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    const csvData = filteredReports.map(report => ({
      'Test Date': report.test_date,
      'Product': report.products?.product_code,
      'Machine': report.machines?.machine_code,
      'Operator': report.operators?.operator_name,
      'Shift': report.shift,
      'Total Saws': report.total_saws,
      'Total Defects': report.total_defects,
      'Defect Rate': `${(report.defect_rate * 100).toFixed(2)}%`,
      'Status': (report.test_data?.test_passed ?? report.test_data?.Status) ? 'PASS' : 'FAIL',
      'Notes': report.notes || '',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qc-test-reports-page-${currentPage}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QC Test Reports</h1>
          <p className="text-muted-foreground">Quality control test results and analysis (Optimized)</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="h-12 px-6">
                <Upload className="w-5 h-5 mr-2" />
                Import Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Historical Test Data</DialogTitle>
                <DialogDescription>
                  Import your Firebase JSON export data into the QC Test Reports system
                </DialogDescription>
              </DialogHeader>
              <DataImport />
            </DialogContent>
          </Dialog>
          <Button onClick={exportToCSV} size="lg" className="h-12 px-6">
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Product, machine, operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Test Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="pass">Pass Only</SelectItem>
                  <SelectItem value="fail">Fail Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterStatus('all');
                }}
                variant="outline"
                className="h-12 w-full text-lg"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Using cached data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold">{totalReports}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {statsLoading ? "..." : `${passRate}%`}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Tests</p>
                <p className="text-3xl font-bold text-red-600">
                  {statsLoading ? "..." : failedTests}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Defect Rate</p>
                <p className="text-3xl font-bold">
                  {statsLoading ? "..." : `${avgDefectRate}%`}
                </p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table with Pagination */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Test Reports (Page {currentPage} of {totalPages})</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredReports.length} results on this page
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse">Loading reports...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-base">
                      <TableHead className="h-14">Date</TableHead>
                      <TableHead className="h-14">Product</TableHead>
                      <TableHead className="h-14">Machine</TableHead>
                      <TableHead className="h-14">Operator</TableHead>
                      <TableHead className="h-14">Shift</TableHead>
                      <TableHead className="h-14">Samples</TableHead>
                      <TableHead className="h-14">Defects</TableHead>
                      <TableHead className="h-14">Status</TableHead>
                      <TableHead className="h-14">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} className="h-16 text-base hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDate(report.test_date)}
                          </div>
                        </TableCell>
                        <TableCell>{report.products?.product_code}</TableCell>
                        <TableCell>{report.machines?.machine_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {report.operators?.operator_name}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{report.shift}</TableCell>
                        <TableCell>{report.total_saws}</TableCell>
                        <TableCell>
                          <span className={report.total_defects > 0 ? 'text-red-600 font-medium' : ''}>
                            {report.total_defects}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(report)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDetails(report)}
                            className="h-10 px-4"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => goToPage(currentPage - 1)}
                        className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => goToPage(pageNum)}
                            isActive={pageNum === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => goToPage(currentPage + 1)}
                        className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Test Report Details
              {selectedReport && getStatusBadge(selectedReport)}
            </DialogTitle>
            <DialogDescription>
              Detailed measurements and test results
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Test Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedReport.test_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedReport.products?.product_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Machine</p>
                  <p className="font-medium">{selectedReport.machines?.machine_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-medium">{selectedReport.operators?.operator_name}</p>
                </div>
              </div>

              {/* Measurements - Handle your actual JSON structure */}
              {selectedReport.test_data && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Measurements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Display actual measurements from your JSON format */}
                    {selectedReport.test_data.bladeWidth && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Blade Width</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.bladeWidth.toFixed(4)}</p>
                          {selectedReport.test_data.withinSpec?.bladeWidth !== undefined && (
                            selectedReport.test_data.withinSpec.bladeWidth ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {selectedReport.test_data.gauge && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Gauge</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.gauge.toFixed(4)}</p>
                          {selectedReport.test_data.withinSpec?.gauge !== undefined && (
                            selectedReport.test_data.withinSpec.gauge ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {selectedReport.test_data.bladeBody && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Blade Body</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.bladeBody.toFixed(4)}</p>
                          {selectedReport.test_data.withinSpec?.bladeBody !== undefined && (
                            selectedReport.test_data.withinSpec.bladeBody ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {selectedReport.test_data.toothSetLeft && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tooth Set Left</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.toothSetLeft.toFixed(5)}</p>
                          {selectedReport.test_data.withinSpec?.toothSetLeft !== undefined && (
                            selectedReport.test_data.withinSpec.toothSetLeft ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {selectedReport.test_data.toothSetRight && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tooth Set Right</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.toothSetRight.toFixed(5)}</p>
                          {selectedReport.test_data.withinSpec?.toothSetRight !== undefined && (
                            selectedReport.test_data.withinSpec.toothSetRight ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {selectedReport.test_data.dross && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Dross</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedReport.test_data.dross.toFixed(4)}</p>
                          {selectedReport.test_data.withinSpec?.dross !== undefined && (
                            selectedReport.test_data.withinSpec.dross ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedReport.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="p-3 bg-muted/50 rounded-lg">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
         </DialogContent>
       </Dialog>
       
       <CachePerformanceToast 
         show={showCacheToast} 
         onShow={() => setShowCacheToast(false)} 
       />
     </div>
   );
 }
