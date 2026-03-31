import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Printer, Tags, Eye, Plus } from 'lucide-react';
import { useCustomerPOs, POLineItem } from '@/hooks/useCustomerPOs';
import { useReferenceData } from '@/hooks/useReferenceData';
import { useInsertPrintedLabel, usePrintedQuantities } from '@/hooks/usePrintedLabels';
import { useGenerateBoxNumber } from '@/hooks/useBoxNumber';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LabelPreview } from '@/components/LabelPreview';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { generateManualZPL, sendZPLToPrinter } from '@/utils/zplGenerator';
import { useCustomers } from '@/hooks/useCustomers';
export function ManualLabelPrint() {
  const {
    toast
  } = useToast();
  const {
    pos
  } = useCustomerPOs();
  const {
    operators,
    machines,
    products
  } = useReferenceData();
  const {
    mutate: insertLabel,
    isPending: isInserting
  } = useInsertPrintedLabel();
  const generateBoxNumber = useGenerateBoxNumber();
  const {
    printerSettings,
    loading: printerLoading
  } = usePrinterSettings();
  const {
    user
  } = useAuth();
  const {
    customers
  } = useCustomers();

  // Session state similar to LaserForm
  const [sessionData, setSessionData] = useState({
    customer_po_id: '',
    customer: '',
    PO: '',
    invoice: '',
    SKU: '',
    quantity: '',
    totalUnits: 0,
    boxAmount: 0,
    date: new Date().toISOString().split('T')[0],
    operator_id: '',
    operator_code: '',
    selectedLineItemIndex: 0
  });
  const [availableSKUs, setAvailableSKUs] = useState<POLineItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  // Get active customer POs
  const activePOs = pos.filter(po => !po.status);

  // Get printed quantities for progress tracking
  const {
    data: printedData
  } = usePrintedQuantities(sessionData.PO, sessionData.SKU, sessionData.selectedLineItemIndex);

  // Calculate progress for selected line item only
  const selectedPOData = activePOs.find(po => po.id === sessionData.customer_po_id);
  const totalRequired = sessionData.totalUnits || 0; // Use selected line item quantity
  const totalPrinted = printedData?.totalPrinted || 0;
  const progressPercentage = totalRequired > 0 ? Math.min(totalPrinted / totalRequired * 100, 100) : 0;

  // Handle PO selection with auto-population
  const handleCustomerPOChange = (poId: string) => {
    const selectedPO = activePOs.find(po => po.id === poId);
    if (selectedPO) {
      const poItems = (selectedPO.items || []) as POLineItem[];
      setAvailableSKUs(poItems);

      // Auto-populate for single item POs
      if (poItems.length === 1) {
        const singleItem = poItems[0];
        const boxAmount = 100; // Use default box amount

        setSessionData({
          ...sessionData,
          customer_po_id: selectedPO.id,
          customer: selectedPO.customer_name,
          PO: selectedPO.po_number,
          SKU: singleItem.sku,
          quantity: boxAmount.toString(),
          totalUnits: singleItem.quantity,
          boxAmount: boxAmount,
          invoice: '',
          selectedLineItemIndex: 0
        });
      } else {
        setSessionData({
          ...sessionData,
          customer_po_id: selectedPO.id,
          customer: selectedPO.customer_name,
          PO: selectedPO.po_number,
          SKU: '',
          quantity: '',
          totalUnits: 0,
          boxAmount: 0,
          invoice: '',
          selectedLineItemIndex: 0
        });
      }
    }
  };

  // Handle SKU selection with auto-population
  const handleSKUSelection = (skuWithIndex: string) => {
    const [sku, indexStr] = skuWithIndex.split('___INDEX___');
    const itemIndex = parseInt(indexStr);
    const selectedLineItem = availableSKUs[itemIndex];
    if (selectedLineItem) {
      const boxAmount = 100; // Use default box amount
      setSessionData({
        ...sessionData,
        SKU: sku,
        totalUnits: selectedLineItem.quantity,
        boxAmount: boxAmount,
        quantity: boxAmount.toString(),
        invoice: '',
        selectedLineItemIndex: itemIndex
      });
    }
  };

  // Handle operator selection
  const handleOperatorChange = (operatorId: string) => {
    const selectedOperator = operators.find(op => op.id === operatorId);
    if (selectedOperator) {
      setSessionData(prev => ({
        ...prev,
        operator_id: selectedOperator.id,
        operator_code: selectedOperator.operator_code
      }));
    }
  };

  // Create preview data
  const previewData = sessionData.PO && sessionData.SKU && sessionData.quantity && sessionData.operator_code ? {
    id: 'preview',
    customer: sessionData.customer,
    po: sessionData.PO,
    sku: sessionData.SKU,
    quantity: parseInt(sessionData.quantity) || 0,
    operator: sessionData.operator_code,
    laser: 'Manual',
    print_date: sessionData.date,
    invoice: sessionData.invoice || '',
    box_number: 'BOX-PREVIEW',
    document_id: '',
    line_item_index: sessionData.selectedLineItemIndex,
    pallet_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: ''
  } : null;

  // Handle print with multiple labels
  const handlePrint = async () => {
    if (!sessionData.customer || !sessionData.PO || !sessionData.SKU || !sessionData.quantity || !sessionData.operator_id || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in Customer PO, SKU, quantity, and operator",
        variant: "destructive"
      });
      return;
    }
    const quantity = parseInt(sessionData.quantity);
    if (quantity <= 0 || quantity > 10000) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be between 1 and 10,000",
        variant: "destructive"
      });
      return;
    }
    if (labelQuantity < 1 || labelQuantity > 50) {
      toast({
        title: "Invalid Label Quantity",
        description: "Label quantity must be between 1 and 50",
        variant: "destructive"
      });
      return;
    }
    setIsPrinting(true);
    setPrintProgress(0);
    try {
      // Get customer template for ZPL generation
      const associatedPO = pos.find(po => po.po_number === sessionData.PO);
      const customerTemplate = associatedPO?.customer_template_id ? customers.find(template => template.id === associatedPO.customer_template_id) : null;
      const printedLabels = [];

      // Print each label with unique box number
      for (let i = 0; i < labelQuantity; i++) {
        const boxNumber = await generateBoxNumber.mutateAsync({
          sku: sessionData.SKU || '',
          po: sessionData.PO || '',
        });

        // Create the label record
        const labelRecord = {
          customer: sessionData.customer,
          po: sessionData.PO,
          sku: sessionData.SKU,
          quantity: quantity,
          operator: sessionData.operator_code,
          laser: 'Manual',
          print_date: sessionData.date,
          box_number: boxNumber,
          invoice: sessionData.invoice || '',
          line_item_index: sessionData.selectedLineItemIndex,
          user_id: user.id
        };

        // Generate and send ZPL to printer
        const zplRecord = {
          id: `manual-print-${i}`,
          ...labelRecord,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          document_id: ''
        };
        const zpl = generateManualZPL(zplRecord, customerTemplate, {
          widthMm: printerSettings.labelWidth,
          heightMm: printerSettings.labelHeight,
        });

        // Send to printer
        await sendZPLToPrinter(zpl, printerSettings.IP);

        // Save to database
        await new Promise<void>((resolve, reject) => {
          insertLabel(labelRecord, {
            onSuccess: () => {
              printedLabels.push(labelRecord);
              resolve();
            },
            onError: error => {
              reject(error);
            }
          });
        });

        // Update progress
        setPrintProgress((i + 1) / labelQuantity * 100);

        // Small delay between prints to avoid overwhelming the printer
        if (i < labelQuantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      toast({
        title: "Labels Printed",
        description: `${labelQuantity} labels for ${sessionData.SKU} printed and saved successfully`
      });

      // Reset form
      setSessionData({
        customer_po_id: '',
        customer: '',
        PO: '',
        invoice: '',
        SKU: '',
        quantity: '',
        totalUnits: 0,
        boxAmount: 0,
        date: new Date().toISOString().split('T')[0],
        operator_id: '',
        operator_code: '',
        selectedLineItemIndex: 0
      });
      setAvailableSKUs([]);
      setShowPreview(false);
      setLabelQuantity(1);
    } catch (error) {
      toast({
        title: "Print Error",
        description: "An error occurred while printing",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
      setPrintProgress(0);
    }
  };

  // Use the existing LabelPreview component for consistent customer template support

  return <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Tags className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Manual Label Printing</CardTitle>
              <p className="text-sm text-muted-foreground">Quick manual label printing</p>
            </div>
          </div>
          {sessionData.PO && <div className="text-right text-sm">
              <div className="font-medium">Progress: {progressPercentage.toFixed(1)}%</div>
              <div className="text-muted-foreground">{totalPrinted} / {totalRequired} units</div>
            </div>}
        </div>
        {sessionData.PO && <Progress value={progressPercentage} className="w-full" />}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer PO Selection */}
          <div className="space-y-2">
            <Label htmlFor="po-select">Customer PO *</Label>
            <Select value={sessionData.customer_po_id} onValueChange={handleCustomerPOChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer PO" />
              </SelectTrigger>
              <SelectContent>
                {activePOs.map(po => <SelectItem key={po.id} value={po.id}>
                    {po.customer_name} - {po.po_number}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* SKU Selection */}
          <div className="space-y-2">
            <Label htmlFor="sku-select">SKU *</Label>
            <Select value={sessionData.SKU ? `${sessionData.SKU}___INDEX___${sessionData.selectedLineItemIndex}` : ''} onValueChange={handleSKUSelection} disabled={!sessionData.customer_po_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {availableSKUs.map((item, index) => <SelectItem key={`${item.sku}_${index}`} value={`${item.sku}___INDEX___${index}`}>
                    {item.sku} (Qty: {item.quantity})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label htmlFor="invoice-select">Invoice (Optional)</Label>
            <Input id="invoice-select" value={sessionData.invoice} onChange={e => setSessionData(prev => ({
            ...prev,
            invoice: e.target.value
          }))} placeholder="Enter invoice number (optional)" />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Per Box Quantity *</Label>
            <Input id="quantity" type="number" min="1" max="10000" value={sessionData.quantity} onChange={e => setSessionData(prev => ({
            ...prev,
            quantity: e.target.value
          }))} placeholder="Enter per box quantity" />
          </div>

          {/* Label Quantity */}
          <div className="space-y-2">
            <Label htmlFor="label-quantity">Number of boxes</Label>
            <Input id="label-quantity" type="number" min="1" max="50" value={labelQuantity} onChange={e => setLabelQuantity(parseInt(e.target.value) || 1)} placeholder="Number of labels to print" />
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <Label htmlFor="operator-select">Operator *</Label>
            <Select value={sessionData.operator_id} onValueChange={handleOperatorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.filter(op => op.active).map(operator => <SelectItem key={operator.id} value={operator.id}>
                    {operator.operator_name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {previewData && <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Label
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manual Label Preview</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <LabelPreview 
                      record={previewData} 
                      labelSize={{
                        widthMm: printerSettings.labelWidth,
                        heightMm: printerSettings.labelHeight,
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>}
          </div>

          <div className="flex items-center gap-2">
            {labelQuantity > 1 && <span className="text-sm text-muted-foreground">
                Will print {labelQuantity} labels
              </span>}
            <Button onClick={handlePrint} disabled={!previewData || isPrinting} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {isPrinting ? `Printing ${Math.round(printProgress)}%` : `Print ${labelQuantity} Label${labelQuantity > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isPrinting && <div className="mt-4 space-y-2">
            <div className="text-sm text-muted-foreground">
              Printing label {Math.ceil(printProgress / 100 * labelQuantity)} of {labelQuantity}
            </div>
            <Progress value={printProgress} className="w-full" />
          </div>}
      </CardContent>
    </Card>;
}