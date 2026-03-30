import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Search, Upload, Eye, Printer } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePrintedLabels, PrintedLabel } from '@/hooks/usePrintedLabels';
import { useOptimizedPrintedLabels } from '@/hooks/useOptimizedQueries';
import { PrintedLabelsImport } from '@/components/PrintedLabelsImport';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LabelPreview } from '@/components/LabelPreview';
import { generateZPL, sendZPLToPrinter } from '@/utils/zplGenerator';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { CachePerformanceToast, cacheStatsTracker } from '@/components/CachePerformanceToast';
import { useCustomerPOs } from '@/hooks/useCustomerPOs';
import { useCustomers } from '@/hooks/useCustomers';

const Boxes = () => {
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<PrintedLabel | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCacheToast, setShowCacheToast] = useState(false);
  const { toast } = useToast();
  const { printerSettings } = usePrinterSettings();
  const { pos } = useCustomerPOs();
  const { customers } = useCustomers();

  const { data: labels = [], isLoading, error } = usePrintedLabels(dateFrom, dateTo);
  const { data: optimizedLabels = [] } = useOptimizedPrintedLabels(
    undefined, 
    { start: format(dateFrom, 'yyyy-MM-dd'), end: format(dateTo, 'yyyy-MM-dd') }
  );

  // Track cache performance for printed labels
  useEffect(() => {
    if (!isLoading && labels.length > 0) {
      const loadTime = 150; // Simulated load time for printed labels
      cacheStatsTracker.recordQuery(loadTime, labels.length > 20);
      setShowCacheToast(true);
    }
  }, [isLoading, labels.length]);

  // Filter labels by search term
  const filteredLabels = labels.filter(label =>
    String(label.box_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (label.po ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreview = (label: PrintedLabel) => {
    setSelectedLabel(label);
    setShowPreview(true);
  };

  const handleReprint = async (label: PrintedLabel) => {
    try {
      // Get customer template for this label
      const associatedPO = filteredLabels.find(l => l.po === label.po);
      const customerTemplate = associatedPO ? 
        customers.find(template => template.id === pos.find(po => po.po_number === associatedPO.po)?.customer_template_id) : 
        null;
      
      const zpl = generateZPL(label, customerTemplate);
      await sendZPLToPrinter(zpl, printerSettings.IP);
      toast({
        title: "Print Successful",
        description: `Label reprinted for ${label.sku}`,
      });
      setShowPreview(false);
    } catch (error) {
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to send print job",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Printed Boxes
            <Button onClick={() => setShowImport(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? formatDate(dateFrom) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? formatDate(dateTo) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search box number, customer, PO, SKU, operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Box Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Laser</TableHead>
                  <TableHead>Pallet</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-destructive">
                      Error loading data
                    </TableCell>
                  </TableRow>
                )}
                {filteredLabels.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      No records found for selected date range
                    </TableCell>
                  </TableRow>
                )}
                {filteredLabels.map((label) => (
                  <TableRow key={label.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {label.box_number || label.document_id || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(label.print_date)}</TableCell>
                    <TableCell>{label.customer}</TableCell>
                    <TableCell>{label.po}</TableCell>
                    <TableCell>{label.sku}</TableCell>
                    <TableCell>{label.quantity}</TableCell>
                    <TableCell>{label.operator}</TableCell>
                    <TableCell>{label.laser}</TableCell>
                    <TableCell>{label.pallet_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(label)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprint(label)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLabels.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredLabels.length} record(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Printed Labels Data</DialogTitle>
          </DialogHeader>
          <PrintedLabelsImport
            onClose={() => setShowImport(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Label Preview & Reprint</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedLabel && <LabelPreview record={selectedLabel} />}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={() => selectedLabel && handleReprint(selectedLabel)}>
              <Printer className="h-4 w-4 mr-2" />
              Reprint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <CachePerformanceToast 
        show={showCacheToast} 
        onShow={() => setShowCacheToast(false)} 
      />
    </div>
  );
};

export default Boxes;