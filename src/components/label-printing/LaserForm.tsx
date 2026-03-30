import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Printer, Eye, Plus } from 'lucide-react';
import { useCustomerPOs, POLineItem } from '@/hooks/useCustomerPOs';
import { useGenerateBoxNumber } from '@/hooks/useBoxNumber';
import { Progress } from '@/components/ui/progress';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { usePrintedQuantities, useInsertPrintedLabel } from '@/hooks/usePrintedLabels';
import { useAuth } from '@/hooks/useAuth';
import { useActivePallets, useCreatePallet, useAssignLabelToPallet, type Pallet } from '@/hooks/usePallets';
import { formatDate } from '@/utils/dateUtils';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { getLabelDimensionsDots, scaleFontSize } from '@/utils/labelScaling';
interface LaserFormProps {
  laserMachine: {
    id: string;
    machine_name: string;
    machine_code: string;
  };
  products: Array<{
    id: string;
    product_code: string;
    product_name: string;
    box_amount: number;
  }>;
  operators: Array<{
    id: string;
    operator_code: string;
    operator_name: string;
  }>;
  sessionData: {
    customer_po_id: string;
    customer: string;
    PO: string;
    invoice: string;
    SKU: string;
    quantity: string;
    totalUnits: number;
    boxAmount: number;
    date: string;
    operator_id: string;
    operator_name: string;
    laser_machine_id: string;
    laser_name: string;
    selectedLineItemIndex?: number;
  };
  onSessionUpdate: (data: any) => void;
  onPrint: (zpl: string) => void;
  companyLogoZPL: string;
}
export function LaserForm({
  laserMachine,
  products,
  operators,
  sessionData,
  onSessionUpdate,
  onPrint,
  companyLogoZPL
}: LaserFormProps) {
  const { toast } = useToast();
  const { pos } = useCustomerPOs();
  const { user } = useAuth();
  const { printerSettings } = usePrinterSettings();
  const insertPrintedLabel = useInsertPrintedLabel();
  const generateBoxNumber = useGenerateBoxNumber();
  
  // Pallet management hooks
  const { data: activePallets } = useActivePallets(sessionData.customer, sessionData.PO);
  const createPallet = useCreatePallet();
  const assignToPallet = useAssignLabelToPallet();
  
  // Get printed quantities for current PO/SKU/LineItem combination
  const { data: printedData } = usePrintedQuantities(
    sessionData.PO, 
    sessionData.SKU, 
    sessionData.selectedLineItemIndex
  );
  const [selectedPOId, setSelectedPOId] = useState<string>(sessionData.customer_po_id);
  const [availableSKUs, setAvailableSKUs] = useState<POLineItem[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<Array<{
    invoice: string;
    received_date: string;
    pallet_number: number | null;
    supplier: string | null;
    quantity_received: number;
  }>>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<string>('unassigned');
  const [showCreatePallet, setShowCreatePallet] = useState(false);
  const [palletCapacity, setPalletCapacity] = useState<number>(48);
  
  // Printing state management
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintTime, setLastPrintTime] = useState(0);

  // Update session when data changes
  const updateSession = (field: string, value: string) => {
    const updated = {
      ...sessionData,
      [field]: value
    };
    onSessionUpdate(updated);
  };

  // Handle PO selection
  const handleCustomerPOChange = (poId: string) => {
    const selectedPO = pos.find(po => po.id === poId);
    if (selectedPO) {
      setSelectedPOId(poId);
      const poItems = selectedPO.items || [];
      setAvailableSKUs(poItems);
      setAvailableInvoices([]); // Clear invoices when PO changes

      // Auto-populate for single item POs
      if (poItems.length === 1) {
        const singleItem = poItems[0];
        const selectedProduct = products.find(p => p.product_code === singleItem.sku);
        const boxAmount = selectedProduct?.box_amount || 100;
        onSessionUpdate({
          ...sessionData,
          customer_po_id: selectedPO.id,
          customer: selectedPO.customer_name,
          PO: selectedPO.po_number,
          SKU: singleItem.sku,
          quantity: boxAmount.toString(),
          totalUnits: singleItem.quantity,
          boxAmount: boxAmount,
          invoice: '' // Clear invoice when PO changes
        });
        
        // Fetch invoices for the auto-selected SKU
        fetchAvailableInvoices(singleItem.sku);
      } else {
        onSessionUpdate({
          ...sessionData,
          customer_po_id: selectedPO.id,
          customer: selectedPO.customer_name,
          PO: selectedPO.po_number,
          SKU: '',
          quantity: '',
          totalUnits: 0,
          boxAmount: 0,
          invoice: '' // Clear invoice when PO changes
        });
      }
    }
  };

  // Handle SKU selection
  const handleSKUSelection = (skuWithIndex: string) => {
    // Parse the SKU and index from the combined string
    const [sku, indexStr] = skuWithIndex.split('___INDEX___');
    const itemIndex = parseInt(indexStr);
    
    const selectedLineItem = availableSKUs[itemIndex];
    const selectedProduct = products.find(p => p.product_code === sku);
    if (selectedLineItem && selectedProduct) {
      const boxAmount = selectedProduct.box_amount || 100;
      onSessionUpdate({
        ...sessionData,
        SKU: sku,
        totalUnits: selectedLineItem.quantity,
        boxAmount: boxAmount,
        quantity: boxAmount.toString(),
        invoice: '', // Clear invoice when SKU changes
        selectedLineItemIndex: itemIndex // Store the line item index
      });
      
      // Fetch available invoices for this SKU
      fetchAvailableInvoices(sku);
    }
  };

  // Fetch available invoices based on selected SKU - using product_materials mapping
  const fetchAvailableInvoices = async (sku: string) => {
    console.log('🔍 fetchAvailableInvoices called with SKU:', sku);
    
    if (!sku) {
      console.log('❌ No SKU provided, clearing invoices');
      setAvailableInvoices([]);
      return;
    }

    try {
      setLoadingInvoices(true);
      console.log('⏳ Loading invoices for SKU:', sku);
      
      // First, get the product ID from the SKU
      const selectedProduct = products.find(p => p.product_code === sku);
      if (!selectedProduct) {
        console.log('❌ Product not found for SKU:', sku);
        setAvailableInvoices([]);
        return;
      }

      console.log('📦 Found product:', selectedProduct.product_name, 'ID:', selectedProduct.id);

      // Get required raw materials for the selected product
      const { data: productMaterials, error: pmError } = await supabase
        .from('product_materials')
        .select(`
          raw_material_id,
          raw_materials:raw_material_id (
            material_code,
            material_name
          )
        `)
        .eq('product_id', selectedProduct.id);

      if (pmError) {
        console.error('❌ Product materials query error:', pmError);
        throw pmError;
      }

      if (!productMaterials || productMaterials.length === 0) {
        console.log('⚠️ No raw materials linked to product:', sku);
        setAvailableInvoices([]);
        toast({
          title: "No Raw Materials Linked",
          description: `No raw materials are linked to product ${sku}. Please check product configuration.`,
          variant: "destructive"
        });
        return;
      }

      // Get all material codes for this product
      const materialCodes = productMaterials.map(pm => pm.raw_materials?.material_code).filter(Boolean);
      console.log('🔧 Raw material codes for product:', materialCodes);

      // Get available invoices for these raw materials (matching by SKU/material code)
      const { data: invoices, error } = await supabase
        .from('goods_received')
        .select(`
          invoice, 
          received_date, 
          pallet_number, 
          supplier, 
          quantity_received
        `)
        .in('sku', materialCodes)
        .eq('good_status', true)
        .not('invoice', 'is', null)
        .order('received_date', { ascending: false });

      if (error) {
        console.error('❌ Invoice query error:', error);
        throw error;
      }

      console.log('✅ Invoice query result:', invoices);
      setAvailableInvoices(invoices || []);
      
      // Auto-select if only one invoice available
      if (invoices && invoices.length === 1) {
        console.log('🔄 Auto-selecting single invoice:', invoices[0].invoice);
        onSessionUpdate({
          ...sessionData,
          invoice: invoices[0].invoice
        });
      } else if (invoices && invoices.length === 0) {
        console.log('⚠️ No invoices found for raw materials:', materialCodes);
        onSessionUpdate({
          ...sessionData,
          invoice: ''
        });
      } else {
        console.log(`📋 Found ${invoices?.length || 0} invoices for raw materials:`, materialCodes);
      }
    } catch (error) {
      console.error('💥 Error fetching invoices:', error);
      setAvailableInvoices([]);
      toast({
        title: "Invoice Loading Error",
        description: `Failed to load invoices for SKU ${sku}: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle operator selection
  const handleOperatorChange = (operatorId: string) => {
    const selectedOperator = operators.find(op => op.id === operatorId);
    if (selectedOperator) {
      onSessionUpdate({
        ...sessionData,
        operator_id: selectedOperator.id,
        operator_name: selectedOperator.operator_name
      });
    }
  };

  // Generate ZPL for label with provided box number
  const generateLabelZPL = async (boxReference: string) => {
    const operatorCode = operators.find(op => op.id === sessionData.operator_id)?.operator_code || '';
    
    // Get label dimensions from settings
    const dimensions = {
      widthMm: printerSettings.labelWidth,
      heightMm: printerSettings.labelHeight,
    };
    const dims = getLabelDimensionsDots(dimensions);
    
    // Calculate scaled positions based on label size
    const customerY = Math.round(dims.heightDots * 0.33);
    const poY = Math.round(dims.heightDots * 0.43);
    const skuY = Math.round(dims.heightDots * 0.52);
    const qtyY = Math.round(dims.heightDots * 0.65);
    const detailsStartY = Math.round(dims.heightDots * 0.69);
    const detailsGap = Math.round(dims.heightDots * 0.05);
    const qrY = Math.round(dims.heightDots * 0.74);
    const qrX = Math.round(dims.widthDots * 0.75);
    
    // Scale font sizes
    const customerFont = scaleFontSize(72, dimensions);
    const poFont = scaleFontSize(36, dimensions);
    const skuFont = scaleFontSize(96, dimensions);
    const qtyFont = scaleFontSize(36, dimensions);
    const detailsFont = scaleFontSize(32, dimensions);
    
    return `
^XA
^PW${dims.widthDots}
${companyLogoZPL}
^FO0,${customerY}^FB${dims.widthDots - 30},1,0,R,0^A0N,${customerFont},${customerFont}^FD${sessionData.customer}^FS
^FO0,${poY}^FB${dims.widthDots - 30},1,0,R,0^A0,${poFont},${poFont}^FDPO: ${sessionData.PO}^FS
^FO0,${skuY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFont},${skuFont}^FD${sessionData.SKU}^FS
^FO0,${qtyY}^FB${dims.widthDots},1,0,C,0^A0,${qtyFont},${qtyFont}^FDPer Box: ${sessionData.quantity}^FS
^FO45,${detailsStartY}^A0,${detailsFont},${detailsFont}^FDInvoice: ${sessionData.invoice || 'N/A'}^FS
^FO45,${detailsStartY + detailsGap}^A0,${detailsFont},${detailsFont}^FDOperator: ${operatorCode}^FS
^FO45,${detailsStartY + detailsGap * 2}^A0,${detailsFont},${detailsFont}^FDLaser: ${laserMachine.machine_name}^FS
^FO45,${detailsStartY + detailsGap * 3}^A0,${detailsFont},${detailsFont}^FDDate: ${sessionData.date}^FS
^FO${qrX},${qrY}^BQN,2,5^FDQA,${boxReference}^FS
^XZ
    `.trim();
  };

  // Handle creating new pallet
  const handleCreatePallet = async () => {
    if (!sessionData.customer || !sessionData.PO) {
      toast({
        title: "Missing Information",
        description: "Please select Customer PO first",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPallet = await createPallet.mutateAsync({
        pallet_number: `${sessionData.customer}-${sessionData.PO}`,
        po: sessionData.PO,
        sku: sessionData.SKU,
      });
      
      setSelectedPalletId(newPallet.id);
      setShowCreatePallet(false);
      
      toast({
        title: "Pallet Created",
        description: `New pallet ${newPallet.pallet_number} created with capacity ${palletCapacity} boxes`,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle print with validation and logging
  const handlePrint = async () => {
    // Prevent multiple rapid clicks (debouncing)
    const now = Date.now();
    const timeSinceLastPrint = now - lastPrintTime;
    const DEBOUNCE_TIME = 2000; // 2 seconds
    
    if (isPrinting) {
      toast({
        title: "Print in Progress",
        description: "Please wait for the current print job to complete",
        variant: "destructive"
      });
      return;
    }
    
    if (timeSinceLastPrint < DEBOUNCE_TIME) {
      toast({
        title: "Please Wait",
        description: `Please wait ${Math.ceil((DEBOUNCE_TIME - timeSinceLastPrint) / 1000)} more seconds before printing again`,
        variant: "destructive"
      });
      return;
    }

    if (!sessionData.customer || !sessionData.PO || !sessionData.SKU || !sessionData.quantity || !sessionData.operator_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in Customer PO, SKU, Quantity, and Operator fields",
        variant: "destructive"
      });
      return;
    }

    // Validate quantity is reasonable
    const quantity = parseInt(sessionData.quantity);
    if (quantity <= 0 || quantity > 10000) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be between 1 and 10,000",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to print labels",
        variant: "destructive"
      });
      return;
    }

    // Set loading state and update last print time
    setIsPrinting(true);
    setLastPrintTime(now);

    try {
      // Generate box number using the proper hook - this will fail if box number generation fails
      console.log('🔢 Generating box number...');
      const boxReference = await generateBoxNumber.mutateAsync();
      console.log('✅ Box number generated:', boxReference);
      
      // Validate box number was generated successfully - if this fails, stop immediately
      if (!boxReference || boxReference === null || boxReference === undefined || boxReference.trim() === '') {
        console.error('❌ Box number generation failed - received:', boxReference);
        throw new Error('Failed to generate box number - printing cannot continue');
      }
      
      // Generate ZPL with the box number
      console.log('🏷️ Generating ZPL with box number:', boxReference);
      const zpl = await generateLabelZPL(boxReference);
      
      // Send to printer first
      await onPrint(zpl);
      
      // If print succeeds, log to database with the same box number
      const operatorName = operators.find(op => op.id === sessionData.operator_id)?.operator_name || 'Unknown';
      
      console.log('💾 Saving printed label to database with box number:', boxReference);
      const printedLabel = await insertPrintedLabel.mutateAsync({
        customer: sessionData.customer,
        po: sessionData.PO,
        sku: sessionData.SKU,
        operator: operatorName,
        laser: laserMachine.machine_name,
        invoice: sessionData.invoice || '',
        quantity: quantity,
        print_date: sessionData.date,
        line_item_index: sessionData.selectedLineItemIndex || 0,
        box_number: boxReference,
        user_id: user.id,
      });
      console.log('✅ Printed label saved successfully:', printedLabel?.id);

      // Assign to pallet if selected and not unassigned
      if (selectedPalletId && selectedPalletId !== 'unassigned' && printedLabel) {
        try {
          await assignToPallet.mutateAsync({
            pallet_id: selectedPalletId,
            printed_label_id: printedLabel.id
          });
        } catch (palletError) {
          toast({
            title: "Print Successful, Pallet Assignment Failed",
            description: "Label printed but could not be assigned to pallet",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Print Successful",
        description: selectedPalletId && selectedPalletId !== 'unassigned'
          ? `Label printed and assigned to pallet (${quantity} units)`
          : `Label printed and logged for ${quantity} units`,
      });

    } catch (error) {
      console.error('Print failed:', error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to print label or log to database",
        variant: "destructive"
      });
    } finally {
      // Always clear loading state
      setIsPrinting(false);
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    if (sessionData.customer_po_id) {
      const selectedPO = pos.find(po => po.id === sessionData.customer_po_id);
      if (selectedPO) {
        setSelectedPOId(sessionData.customer_po_id);
        setAvailableSKUs(selectedPO.items || []);
      }
    }
  }, [pos, sessionData.customer_po_id]);

  // Fetch invoices when SKU changes (for loading existing sessions)
  useEffect(() => {
    if (sessionData.SKU) {
      fetchAvailableInvoices(sessionData.SKU);
    }
  }, [sessionData.SKU]);

  // Preview component - dynamically sized based on printer settings
  const LabelPreview = () => {
    const operatorCode = operators.find(op => op.id === sessionData.operator_id)?.operator_code || '';
    const boxReference = `BOX-${Date.now().toString().slice(-6)}`;
    
    // Calculate preview dimensions based on label settings (scale to fit ~320px max width)
    const maxPreviewWidth = 320;
    const aspectRatio = printerSettings.labelHeight / printerSettings.labelWidth;
    const previewWidth = maxPreviewWidth;
    const previewHeight = Math.round(maxPreviewWidth * aspectRatio);
    
    // Detect compact layout (aspect ratio <= 0.6)
    const isCompact = aspectRatio <= 0.6;
    
    if (isCompact) {
      // Compact horizontal layout for 100x50mm style
      return (
        <div 
          className="mx-auto bg-white border-2 border-gray-300 text-black relative overflow-hidden" 
          style={{ 
            width: `${previewWidth}px`, 
            height: `${previewHeight}px`,
            padding: '8px' 
          }}
        >
          {/* Logo - top left, bigger */}
          <img 
            src="/BTLogo.png" 
            alt="Bladetech Logo" 
            className="absolute object-contain"
            style={{ top: '6px', left: '8px', height: '40px', width: 'auto' }}
          />
          
          {/* Customer + PO - top right area */}
          <div className="absolute text-right" style={{ top: '6px', right: '8px', maxWidth: '45%' }}>
            <div className="font-bold text-sm truncate">{sessionData.customer}</div>
            <div className="text-xs truncate">PO: {sessionData.PO}</div>
          </div>
          
          {/* SKU - center, moved down */}
          <div className="absolute text-center w-full" style={{ top: '55%', transform: 'translateY(-50%)' }}>
            <div className="text-2xl font-bold">{sessionData.SKU}</div>
            <div className="text-sm">Qty: {sessionData.quantity}</div>
          </div>
          
          {/* Details bottom left */}
          <div className="absolute text-xs" style={{ bottom: '6px', left: '8px' }}>
            {sessionData.invoice && <span className="mr-2">{sessionData.invoice}</span>}
            <span>{sessionData.date}</span>
            <span className="ml-2">{operatorCode}</span>
            <span className="ml-2">{laserMachine.machine_code}</span>
          </div>
          
          {/* QR Code - bottom right */}
          <div className="absolute" style={{ bottom: '4px', right: '8px' }}>
            <QRCodeCanvas value={boxReference} size={45} level="M" />
          </div>
        </div>
      );
    }
    
    // Standard layout for square/tall labels
    return (
      <div 
        className="mx-auto bg-white border-2 border-gray-300 text-black flex flex-col" 
        style={{ 
          width: `${previewWidth}px`, 
          height: `${previewHeight}px`,
          padding: '4mm' 
        }}
      >        
        <div className="flex justify-start mb-2">
          <img 
            src="/BTLogo.png" 
            alt="Bladetech Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>
        
        <div className="text-right mb-4">
          <div className="text-xl">{sessionData.customer}</div>
          <div className="text-sm">PO: {sessionData.PO}</div>
        </div>
        
        <div className="text-center my-4">
          <div className="text-3xl font-bold">{sessionData.SKU}</div>
          <div className="text-lg">Per Box: {sessionData.quantity}</div>
        </div>
        
        <div className="flex justify-between items-end flex-1" style={{ paddingBottom: '2mm' }}>
          <div className="text-xs" style={{ marginBottom: '2mm' }}>
            <div>Invoice: {sessionData.invoice || 'N/A'}</div>
            <div>Operator: {operatorCode}</div>
            <div>Laser: {laserMachine.machine_name}</div>
            <div>Date: {sessionData.date}</div>
          </div>
          <div className="w-16 h-16 border border-gray-400 flex items-center justify-center" style={{ marginBottom: '2mm' }}>
            <QRCodeCanvas 
              value={boxReference}
              size={60}
              level="M"
            />
          </div>
        </div>
      </div>
    );
  };
  return <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center">
          {laserMachine.machine_name}
          <span className="block text-sm font-normal text-muted-foreground">
            {laserMachine.machine_code}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`po-${laserMachine.id}`}>Customer PO *</Label>
          <Select value={selectedPOId} onValueChange={handleCustomerPOChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Customer PO" />
            </SelectTrigger>
            <SelectContent>
              {pos
                .sort((a, b) => {
                  // Sort by delivery_date if available, otherwise po_date, with earliest dates first
                  const dateA = new Date(a.delivery_date || a.po_date);
                  const dateB = new Date(b.delivery_date || b.po_date);
                  return dateA.getTime() - dateB.getTime();
                })
                .map(po => (
                <SelectItem key={po.id} value={po.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{po.customer_name} - {po.po_number}</span>
                    <span className="text-sm text-muted-foreground">
                      {po.delivery_date ? `Due: ${formatDate(po.delivery_date)}` : 
                       `PO Date: ${formatDate(po.po_date)}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`invoice-${laserMachine.id}`}>Invoice</Label>
          <Select 
            value={sessionData.invoice || ""} 
            onValueChange={(value) => {
              console.log('🔄 Invoice selection changed:', value, 'for machine:', laserMachine.machine_name);
              // Clear any existing selection first, then set new value
              onSessionUpdate({
                ...sessionData,
                invoice: value
              });
            }}
            disabled={!sessionData.SKU || loadingInvoices}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !sessionData.SKU 
                  ? "Select SKU first" 
                  : loadingInvoices 
                    ? "Loading invoices..." 
                    : availableInvoices.length === 0 
                      ? "No invoices available"
                      : "Select single invoice"
              } />
            </SelectTrigger>
            <SelectContent>
              {availableInvoices
                // Remove duplicates by grouping by invoice number and taking the most recent one
                .reduce((unique, current) => {
                  const existing = unique.find(item => item.invoice === current.invoice);
                  if (!existing) {
                    unique.push(current);
                  } else {
                    // Keep the one with the most recent received_date
                    const currentDate = new Date(current.received_date);
                    const existingDate = new Date(existing.received_date);
                    if (currentDate > existingDate) {
                      const index = unique.indexOf(existing);
                      unique[index] = current;
                    }
                  }
                  return unique;
                }, [] as typeof availableInvoices)
                .map((invoice, index) => (
                <SelectItem 
                  key={`${laserMachine.id}-${invoice.invoice}-${invoice.received_date}`} 
                  value={invoice.invoice}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.invoice}</span>
                    <span className="text-xs text-muted-foreground">
                      Received: {formatDate(invoice.received_date)}
                      {invoice.pallet_number && ` | Pallet: ${invoice.pallet_number}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`sku-${laserMachine.id}`}>SKU *</Label>
          <Select value={sessionData.SKU ? `${sessionData.SKU}___INDEX___${sessionData.selectedLineItemIndex || 0}` : ''} onValueChange={handleSKUSelection} disabled={!selectedPOId}>
            <SelectTrigger>
              <SelectValue placeholder={selectedPOId ? "Select SKU from PO" : "Select PO first"} />
            </SelectTrigger>
            <SelectContent>
              {availableSKUs.map((item, index) => (
                <SelectItem key={index} value={`${item.sku}___INDEX___${index}`}>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.sku} #{index + 1}</span>
                      {item.dispatch_date && (
                        <span className="text-xs text-muted-foreground">
                          Dispatch: {formatDate(item.dispatch_date)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground ml-4">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPOId && sessionData.SKU && (() => {
          const selectedPO = pos.find(po => po.id === selectedPOId);
          if (!selectedPO) return null;
          
          // Find the specific line item using the stored index
          const lineItemIndex = sessionData.selectedLineItemIndex || 0;
          const selectedLineItem = availableSKUs[lineItemIndex];
          if (!selectedLineItem) return null;
          
          const lineItemRequired = selectedLineItem.quantity;
          
          // Calculate actual printed quantity for this specific line item
          const lineItemPrinted = printedData?.totalPrinted || 0;
          const lineItemProgressPercentage = lineItemRequired > 0 ? (lineItemPrinted / lineItemRequired) * 100 : 0;
          
          return (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Line Item #{lineItemIndex + 1} Progress ({sessionData.SKU})</span>
                <span className="text-muted-foreground">{Math.round(lineItemProgressPercentage)}%</span>
              </div>
              <Progress value={lineItemProgressPercentage} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{lineItemPrinted} / {lineItemRequired} units printed</span>
                <span>{Math.ceil((lineItemRequired - lineItemPrinted) / (parseInt(sessionData.quantity) || 1))} boxes remaining</span>
              </div>
              {selectedLineItem.dispatch_date && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span>Due: {formatDate(selectedLineItem.dispatch_date)}</span>
                </div>
              )}
            </div>
          );
        })()}

        <div>
          <Label htmlFor={`quantity-${laserMachine.id}`}>Units per Box *</Label>
          <Input id={`quantity-${laserMachine.id}`} value={sessionData.quantity} onChange={e => updateSession('quantity', e.target.value)} placeholder="Units per box" type="number" />
          {sessionData.totalUnits > 0 && sessionData.boxAmount > 0 && <p className="text-xs text-muted-foreground mt-1">
              Total Units: {sessionData.totalUnits} | Boxes Needed: {Math.ceil(sessionData.totalUnits / sessionData.boxAmount)}
            </p>}
        </div>

        <div>
          <Label htmlFor={`date-${laserMachine.id}`}>Date</Label>
          <Input id={`date-${laserMachine.id}`} value={sessionData.date} onChange={e => updateSession('date', e.target.value)} type="date" />
        </div>

        <div>
          <Label htmlFor={`operator-${laserMachine.id}`}>Operator</Label>
          <Select value={sessionData.operator_id} onValueChange={handleOperatorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map(operator => <SelectItem key={operator.id} value={operator.id}>
                  {operator.operator_code} - {operator.operator_name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Pallet Assignment Section */}
        {sessionData.customer && sessionData.PO && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Pallet Assignment (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreatePallet(true)}
                disabled={!sessionData.customer || !sessionData.PO}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Pallet
              </Button>
            </div>
            
            <Select value={selectedPalletId} onValueChange={setSelectedPalletId}>
              <SelectTrigger>
                <SelectValue placeholder="Select pallet or leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No pallet (unassigned)</SelectItem>
                {activePallets?.map(pallet => (
                  <SelectItem key={pallet.id} value={pallet.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{pallet.pallet_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {pallet.pallet_number}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create Pallet Dialog */}
            <Dialog open={showCreatePallet} onOpenChange={setShowCreatePallet}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Pallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Customer:</strong> {sessionData.customer}</p>
                    <p><strong>PO:</strong> {sessionData.PO}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="pallet-capacity">Boxes per Pallet</Label>
                    <Input
                      id="pallet-capacity"
                      type="number"
                      value={palletCapacity}
                      onChange={(e) => setPalletCapacity(parseInt(e.target.value) || 48)}
                      min="1"
                      max="200"
                      placeholder="Number of boxes"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreatePallet(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePallet}>
                      Create Pallet
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handlePrint} 
            className="flex-1" 
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? "Printing..." : "Print"}
          </Button>
          
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Label Preview - {laserMachine.machine_name}</DialogTitle>
              </DialogHeader>
              <LabelPreview />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>;
}