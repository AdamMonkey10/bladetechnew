import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoodsReceived } from '@/hooks/useGoodsReceived';
import { Download, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Inventory() {
  const { goodsReceived, isLoading, updateStatus, isUpdating } = useGoodsReceived();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    return goodsReceived.filter(item => {
      const matchesSearch = 
        item.invoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pallet_number?.toString().includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'complete' && !item.good_status) ||
        (statusFilter === 'active' && item.good_status);

      return matchesSearch && matchesStatus;
    });
  }, [goodsReceived, searchTerm, statusFilter]);

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) {
      return;
    }

    const headers = [
      'Invoice', 'Pallet Number', 'SKU', 'Supplier', 'Received Date', 
      'Quantity', 'Status', 'Height', 'Gauge', 'Reference Number'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.invoice || '',
        item.pallet_number || '',
        item.sku || '',
        item.suppliers?.name || '',
        item.received_date ? format(new Date(item.received_date), 'yyyy-MM-dd') : '',
        item.quantity_received || '',
        item.good_status ? 'Active' : 'Complete',
        item.height || '',
        item.gauge || '',
        item.reference_number || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    updateStatus({ id, good_status: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Reports</h1>
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Reports</h1>
          <p className="text-muted-foreground">Goods received inventory tracking</p>
        </div>
        <Button onClick={handleDownloadCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by invoice, SKU, supplier, or pallet number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No stock entries found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pallet #</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.invoice || 'N/A'}</TableCell>
                      <TableCell>{item.pallet_number || 'N/A'}</TableCell>
                      <TableCell>{item.sku || 'N/A'}</TableCell>
                      <TableCell>{item.suppliers?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {item.received_date ? format(new Date(item.received_date), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{item.quantity_received}</TableCell>
                      <TableCell>
                        <Badge variant={item.good_status ? "default" : "secondary"}>
                          {item.good_status ? 'Active' : 'Complete'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusToggle(item.id, item.good_status || false)}
                          disabled={isUpdating}
                          className="flex items-center gap-1"
                        >
                          {item.good_status ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Mark Complete
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Mark Active
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}