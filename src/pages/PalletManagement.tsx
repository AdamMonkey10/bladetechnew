import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  usePallets, 
  useCreatePallet, 
  useUpdatePalletStatus, 
  usePalletDetails,
  useUnassignLabelFromPallet,
  type CreatePalletData 
} from '@/hooks/usePallets';
import { useCustomerPOs } from '@/hooks/useCustomerPOs';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { CachePerformanceToast } from '@/components/CachePerformanceToast';
import { generatePalletZPL, PalletLabelData } from '@/utils/palletZplGenerator';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Package, 
  Plus, 
  Ship, 
  CheckCircle, 
  Clock, 
  Eye,
  Printer,
  X,
  Settings,
  Edit
} from 'lucide-react';

export default function PalletManagement() {
  const { toast } = useToast();
  const { data: pallets, isLoading } = usePallets();
  const { pos } = useCustomerPOs();
  const createPallet = useCreatePallet();
  const updatePalletStatus = useUpdatePalletStatus();
  const { printerSettings, updatePrinterSettings } = usePrinterSettings();
  
  const [selectedPalletId, setSelectedPalletId] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [editingPallet, setEditingPallet] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ pallet: any; assignments: any[] } | null>(null);
  const [showCacheToast, setShowCacheToast] = useState(false);

  // Show cache performance notification when pallets load instantly
  useEffect(() => {
    if (!isLoading && pallets && pallets.length > 0) {
      setShowCacheToast(true);
    }
  }, [isLoading, pallets]);
  
  // Filter pallets by status
  const activePallets = pallets?.filter(p => p.status === 'active') || [];
  const completedPallets = pallets?.filter(p => p.status === 'completed') || [];
  const shippedPallets = pallets?.filter(p => p.status === 'shipped') || [];

  // Show print preview instead of printing directly
  const handleShowPrintPreview = (pallet: any, assignments: any[]) => {
    setPreviewData({ pallet, assignments });
    setShowPrintPreview(true);
  };

  // Actual print function (called after preview confirmation)
  const printPalletLabel = async (pallet: any, assignments: any[]) => {
    try {
      // Aggregate SKU data
      const skuSummary = assignments.reduce((acc: any, assignment: any) => {
        const sku = assignment.printed_labels.sku;
        if (!acc[sku]) {
          acc[sku] = { sku, quantity: 0, boxes: 0 };
        }
        acc[sku].quantity += assignment.printed_labels.quantity;
        acc[sku].boxes += 1;
        return acc;
      }, {});

      const labelData: PalletLabelData = {
        pallet,
        labels: Object.values(skuSummary)
      };

      const zpl = generatePalletZPL(labelData, {
        widthMm: printerSettings.labelWidth,
        heightMm: printerSettings.labelHeight,
      });
      
      // Send to printer
      const response = await fetch(`http://${printerSettings.IP}:${printerSettings.Port}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: zpl,
      });

      if (!response.ok) {
        throw new Error(`Printer responded with ${response.status}`);
      }

      setShowPrintPreview(false);
      toast({
        title: "Print Successful",
        description: `Pallet label printed for ${pallet.pallet_number}`,
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: `Failed to print pallet label: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleCreatePallet = async (data: CreatePalletData) => {
    await createPallet.mutateAsync(data);
    setShowCreateDialog(false);
  };

  const handleStatusUpdate = async (palletId: string, status: 'completed' | 'shipped') => {
    await updatePalletStatus.mutateAsync({ palletId, status });
  };

  const handleEditPallet = (pallet: any) => {
    setEditingPallet(pallet);
    setShowEditDialog(true);
  };

  const handleUpdateCapacity = async (newCapacity: number) => {
    if (!editingPallet) return;
    
    try {
      // Update pallet capacity via direct supabase call
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('pallets')
        .update({ notes: `capacity:${newCapacity}` })
        .eq('id', editingPallet.id);

      if (error) throw error;

      toast({
        title: "Capacity Updated",
        description: `Pallet capacity updated to ${newCapacity} boxes`,
      });
      
      setShowEditDialog(false);
      setEditingPallet(null);
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to update pallet capacity: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'shipped': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'completed': return CheckCircle;
      case 'shipped': return Ship;
      default: return Package;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CachePerformanceToast 
        show={showCacheToast} 
        onShow={() => setShowCacheToast(false)} 
      />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pallet Management</h1>
            <p className="text-muted-foreground">Manage pallets and track label assignments</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showPrinterSettings} onOpenChange={setShowPrinterSettings}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Printer Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Printer Settings</DialogTitle>
                </DialogHeader>
                <PrinterSettingsForm 
                  settings={printerSettings} 
                  onUpdate={updatePrinterSettings}
                  onClose={() => setShowPrinterSettings(false)}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Pallet</DialogTitle>
                </DialogHeader>
                <CreatePalletForm onSubmit={handleCreatePallet} pos={pos} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activePallets.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedPallets.length})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({shippedPallets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <PalletGrid 
            pallets={activePallets} 
            onStatusUpdate={handleStatusUpdate}
            onViewDetails={(id) => {
              setSelectedPalletId(id);
              setShowDetailsDialog(true);
            }}
            onPrintLabel={handleShowPrintPreview}
            onEditPallet={handleEditPallet}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <PalletGrid 
            pallets={completedPallets} 
            onStatusUpdate={handleStatusUpdate}
            onViewDetails={(id) => {
              setSelectedPalletId(id);
              setShowDetailsDialog(true);
            }}
            onPrintLabel={handleShowPrintPreview}
            onEditPallet={handleEditPallet}
          />
        </TabsContent>
        
        <TabsContent value="shipped" className="space-y-4">
          <PalletGrid 
            pallets={shippedPallets} 
            onStatusUpdate={handleStatusUpdate}
            onViewDetails={(id) => {
              setSelectedPalletId(id);
              setShowDetailsDialog(true);
            }}
            onPrintLabel={handleShowPrintPreview}
            onEditPallet={handleEditPallet}
          />
        </TabsContent>
      </Tabs>

      {/* Pallet Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pallet Details</DialogTitle>
          </DialogHeader>
          {selectedPalletId && (
            <PalletDetailsView 
              palletId={selectedPalletId} 
              onPrintLabel={handleShowPrintPreview}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Pallet Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pallet Capacity</DialogTitle>
          </DialogHeader>
          {editingPallet && (
            <EditPalletForm 
              pallet={editingPallet}
              onUpdate={handleUpdateCapacity}
              onClose={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pallet Label Preview</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <PalletLabelPreview 
                pallet={previewData.pallet}
                assignments={previewData.assignments}
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPrintPreview(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => printPalletLabel(previewData.pallet, previewData.assignments)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pallet Label Preview Component
function PalletLabelPreview({ 
  pallet, 
  assignments 
}: { 
  pallet: any; 
  assignments: any[] 
}) {
  // Aggregate SKU data same way as the ZPL generator
  const skuSummary = assignments.reduce((acc: any, assignment: any) => {
    const sku = assignment.printed_labels.sku;
    if (!acc[sku]) {
      acc[sku] = { sku, quantity: 0, boxes: 0 };
    }
    acc[sku].quantity += assignment.printed_labels.quantity;
    acc[sku].boxes += 1;
    return acc;
  }, {});

  const labels = Object.values(skuSummary) as any[];
  const totalBoxes = pallet.current_count;
  const totalUnits = pallet.total_quantity;

  return (
    <div className="w-96 h-96 mx-auto bg-white border-2 border-gray-300 p-3 text-black flex flex-col">
      {/* Company Logo */}
      <div className="flex justify-start mb-2">
        <img 
          src="/BTLogo.png" 
          alt="Bladetech Logo" 
          className="h-12 w-auto object-contain"
        />
      </div>
      
      {/* Customer and PO aligned right */}
      <div className="text-right mb-4">
        <div className="text-lg font-semibold">{pallet.customer}</div>
        <div className="text-sm">PO: {pallet.po_number}</div>
      </div>
      
      {/* SKU Summary - Centered with much larger text */}
      <div className="flex-1 flex flex-col justify-center mb-4">
        <div className="text-center space-y-3">
          {labels.length > 0 ? (
            labels.slice(0, 2).map((label: any, index: number) => (
              <div key={index} className="text-center space-y-1">
                <div className="font-bold text-4xl leading-tight">{label.sku}</div>
                <div className="text-base text-gray-600">{label.boxes} boxes ({label.quantity} units)</div>
              </div>
            ))
          ) : (
            <div className="text-center space-y-2">
              <div className="font-bold text-2xl">NO LABELS</div>
              <div className="font-bold text-2xl">ASSIGNED</div>
            </div>
          )}
          {labels.length > 2 && (
            <div className="text-center text-gray-500 text-base">
              + {labels.length - 2} more SKUs
            </div>
          )}
        </div>
      </div>
      
      {/* Large Totals - Centered */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold">{totalUnits} BLADES</div>
        <div className="text-xl font-semibold">{totalBoxes} BOXES</div>
      </div>
      
      {/* Footer with QR code */}
      <div className="flex justify-end items-end">
        <div className="w-16 h-16 border border-gray-400 flex items-center justify-center">
          <QRCodeCanvas 
            value={`${window.location.origin}/pallet-management?pallet=${pallet.id}`}
            size={60}
            level="M"
          />
        </div>
      </div>
    </div>
  );
}

// Edit Pallet Form Component
function EditPalletForm({ 
  pallet,
  onUpdate, 
  onClose 
}: { 
  pallet: any;
  onUpdate: (capacity: number) => void; 
  onClose: () => void 
}) {
  const [capacity, setCapacity] = useState(pallet.max_capacity.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(parseInt(capacity));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Pallet:</strong> {pallet.pallet_number}</p>
        <p><strong>Customer:</strong> {pallet.customer}</p>
        <p><strong>PO:</strong> {pallet.po_number}</p>
        <p><strong>Current:</strong> {pallet.current_count} boxes</p>
      </div>
      
      <div>
        <Label htmlFor="edit-capacity">Max Capacity (boxes)</Label>
        <Input
          id="edit-capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          min={pallet.current_count} // Can't set lower than current count
          max="200"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Must be at least {pallet.current_count} (current box count)
        </p>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Update Capacity
        </Button>
      </div>
    </form>
  );
}

// Printer Settings Form Component
function PrinterSettingsForm({ 
  settings, 
  onUpdate, 
  onClose 
}: { 
  settings: any; 
  onUpdate: (settings: any) => void; 
  onClose: () => void 
}) {
  const [ip, setIp] = useState(settings.IP);
  const [port, setPort] = useState(settings.Port.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ IP: ip, Port: parseInt(port) });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="printer-ip">Printer IP Address</Label>
        <Input
          id="printer-ip"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="10.0.1.90"
          required
        />
      </div>
      <div>
        <Label htmlFor="printer-port">Printer Port</Label>
        <Input
          id="printer-port"
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="9100"
          required
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Settings
        </Button>
      </div>
    </form>
  );
}

// Create Pallet Form Component
function CreatePalletForm({ onSubmit, pos }: { onSubmit: (data: CreatePalletData) => void; pos: any[] }) {
  const [customer, setCustomer] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('48');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customer,
      po_number: poNumber,
      max_capacity: parseInt(maxCapacity)
    });
  };

  const uniqueCustomers = [...new Set(pos.map(po => po.customer_name))];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customer">Customer</Label>
        <Select value={customer} onValueChange={setCustomer} required>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {uniqueCustomers.map(customerName => (
              <SelectItem key={customerName} value={customerName}>
                {customerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="po_number">PO Number</Label>
        <Select value={poNumber} onValueChange={setPoNumber} required disabled={!customer}>
          <SelectTrigger>
            <SelectValue placeholder={customer ? "Select PO number" : "Select customer first"} />
          </SelectTrigger>
          <SelectContent>
            {pos
              .filter(po => po.customer_name === customer)
              .map(po => (
                <SelectItem key={po.po_number} value={po.po_number}>
                  {po.po_number}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="max_capacity">Max Capacity (boxes)</Label>
        <Input
          id="max_capacity"
          type="number"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          min="1"
          max="100"
        />
      </div>

      <Button type="submit" className="w-full">Create Pallet</Button>
    </form>
  );
}

// Pallet Grid Component
function PalletGrid({ 
  pallets, 
  onStatusUpdate, 
  onViewDetails,
  onPrintLabel,
  onEditPallet
}: { 
  pallets: any[]; 
  onStatusUpdate: (id: string, status: 'completed' | 'shipped') => void;
  onViewDetails: (id: string) => void;
  onPrintLabel: (pallet: any, assignments: any[]) => void;
  onEditPallet: (pallet: any) => void;
}) {
  if (pallets.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No pallets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pallets.map(pallet => (
        <PalletCard 
          key={pallet.id} 
          pallet={pallet} 
          onStatusUpdate={onStatusUpdate}
          onViewDetails={onViewDetails}
          onPrintLabel={onPrintLabel}
          onEditPallet={onEditPallet}
        />
      ))}
    </div>
  );
}

// Pallet Card Component
function PalletCard({ 
  pallet, 
  onStatusUpdate, 
  onViewDetails,
  onPrintLabel,
  onEditPallet
}: { 
  pallet: any; 
  onStatusUpdate: (id: string, status: 'completed' | 'shipped') => void;
  onViewDetails: (id: string) => void;
  onPrintLabel: (pallet: any, assignments: any[]) => void;
  onEditPallet: (pallet: any) => void;
}) {
  const StatusIcon = getStatusIcon(pallet.status);
  const fillPercentage = (pallet.current_count / pallet.max_capacity) * 100;

  const handlePrint = () => {
    // For card printing, we'll get the assignments from the pallet details API
    // For now, print with empty assignments (just basic pallet info)
    onPrintLabel(pallet, []);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{pallet.pallet_number}</CardTitle>
          <Badge className={getStatusColor(pallet.status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {pallet.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{pallet.customer}</p>
          <p>PO: {pallet.po_number}</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Capacity</span>
              <span>{pallet.current_count} / {pallet.max_capacity}</span>
            </div>
            <Progress value={fillPercentage} className="h-2" />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Total Quantity: {pallet.total_quantity}</p>
            <p>Created: {new Date(pallet.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(pallet.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            
            {pallet.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditPallet(pallet)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            
            {pallet.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(pallet.id, 'completed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            
            {pallet.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(pallet.id, 'shipped')}
              >
                <Ship className="h-4 w-4 mr-1" />
                Ship
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Pallet Details View Component
function PalletDetailsView({ 
  palletId, 
  onPrintLabel 
}: { 
  palletId: string;
  onPrintLabel: (pallet: any, assignments: any[]) => void;
}) {
  const { data, isLoading } = usePalletDetails(palletId);
  const unassignLabel = useUnassignLabelFromPallet();

  if (isLoading) {
    return <div className="text-center p-4">Loading pallet details...</div>;
  }

  if (!data) {
    return <div className="text-center p-4">Pallet not found</div>;
  }

  const { pallet, assignments } = data;

  const handlePrint = () => {
    onPrintLabel(pallet, assignments);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Pallet Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Number:</strong> {pallet.pallet_number}</p>
            <p><strong>Customer:</strong> {pallet.customer}</p>
            <p><strong>PO:</strong> {pallet.po_number}</p>
            <p><strong>Status:</strong> {pallet.status}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold">Capacity & Content</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Boxes:</strong> {pallet.current_count} / {pallet.max_capacity}</p>
            <p><strong>Total Units:</strong> {pallet.total_quantity}</p>
            <p><strong>Created:</strong> {new Date(pallet.created_at).toLocaleDateString()}</p>
            {pallet.completed_at && (
              <p><strong>Completed:</strong> {new Date(pallet.completed_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Print Label Button */}
      <div className="flex justify-center">
        <Button onClick={handlePrint} size="lg">
          <Printer className="h-5 w-5 mr-2" />
          Print Pallet Label
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Assigned Labels ({assignments.length})</h3>
        
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No labels assigned to this pallet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-sm">
                    <strong>{assignment.printed_labels.sku}</strong> - {assignment.printed_labels.quantity} units
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {assignment.printed_labels.customer} | PO: {assignment.printed_labels.po}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                  </div>
                </div>
                
                {pallet.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unassignLabel.mutateAsync(assignment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'completed': return 'bg-blue-500';
    case 'shipped': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return Clock;
    case 'completed': return CheckCircle;
    case 'shipped': return Ship;
    default: return Package;
  }
}