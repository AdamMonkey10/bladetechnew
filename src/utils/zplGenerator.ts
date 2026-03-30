import { PrintedLabel } from '@/hooks/usePrintedLabels';
import { Customer } from '@/hooks/useCustomers';
import { 
  LabelDimensions, 
  DEFAULT_LABEL_SIZE, 
  mmToZplDots, 
  calculateBoxLabelPositions,
  getScaleFactor,
  scaleFontSize,
  getLabelDimensionsDots,
  isCompactLabel
} from './labelScaling';

export const generateZPL = (
  record: PrintedLabel, 
  customerTemplate?: Customer | null,
  labelSize?: LabelDimensions
): string => {
  // Use provided dimensions or default
  const dimensions = labelSize || DEFAULT_LABEL_SIZE;
  const dims = getLabelDimensionsDots(dimensions);
  const positions = calculateBoxLabelPositions(dimensions);
  const compact = isCompactLabel(dimensions);
  
  // Use customer template logo positioning if available, otherwise use calculated
  const logoPosition = customerTemplate?.logo_position || { 
    x: dimensions.widthMm * 0.02, 
    y: dimensions.heightMm * 0.05, 
    width: 48, 
    height: 16 
  };
  
  // Convert mm positions to ZPL coordinates
  const logoX = mmToZplDots(logoPosition.x);
  const logoY = mmToZplDots(logoPosition.y);
  
  // Handle logo ZPL properly
  let logoCommand = '';
  if (customerTemplate?.zpl_code) {
    let cleanZpl = customerTemplate.zpl_code.trim();
    cleanZpl = cleanZpl.replace(/^\^FO\d+,\d+/, '');
    cleanZpl = cleanZpl.replace(/\^FS$/, '');
    
    if (!cleanZpl.includes('^GFA') && !cleanZpl.includes('^GF') && !cleanZpl.includes('^XG')) {
      console.warn('Customer ZPL does not contain recognizable graphics data:', cleanZpl.substring(0, 100));
    }
    
    logoCommand = `^FO${logoX},${logoY}${cleanZpl}^FS`;
  } else {
    logoCommand = `^FO${logoX},${logoY}${companyLogoZPL()}^FS`;
  }
  
  // Get font sizes from calculated positions
  const customerFontSize = positions.customer.fontSize || 48;
  const poFontSize = positions.po.fontSize || 32;
  const skuFontSize = positions.sku.fontSize || 88;
  const qtyFontSize = positions.quantity.fontSize || 36;
  const detailFontSize = positions.invoice.fontSize || 24;
  
  // Get Y positions from calculated positions
  const customerY = positions.customer.y;
  const poY = positions.po.y;
  const skuY = positions.sku.y;
  const qtyY = positions.quantity.y;
  const invoiceY = positions.invoice.y;
  const dateY = positions.date.y;
  const operatorY = positions.operator.y;
  const laserY = positions.laser.y;
  const qrX = positions.qrCode.x;
  const qrY = positions.qrCode.y;
  const qrMag = positions.qrCode.width || 3;
  
  // Field block widths depend on layout
  const fieldBlockWidth = dims.widthDots - 30;
  const leftBlockWidth = Math.round(dims.widthDots * 0.35);
  
  let zpl: string;
  
  if (compact) {
    // Compact layout for 100x50mm - new arrangement:
    // Logo (top-left, bigger), Customer/PO (top-right)
    // SKU + Qty (center, lower on label)
    // Details (bottom-left single row), QR (bottom-right)
    zpl = `^XA
^PW${dims.widthDots}
${logoCommand}
^FO${positions.customer.x},${customerY}^A0N,${customerFontSize},${customerFontSize}^FD${record.customer}^FS
^FO${positions.po.x},${poY}^A0,${poFontSize},${poFontSize}^FDPO: ${record.po}^FS
^FO0,${skuY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFontSize},${skuFontSize}^FD${record.sku}^FS
^FO0,${qtyY}^FB${dims.widthDots},1,0,C,0^A0,${qtyFontSize},${qtyFontSize}^FDQty: ${record.quantity}^FS
${record.invoice ? `^FO${positions.invoice.x},${invoiceY}^A0,${detailFontSize},${detailFontSize}^FD${record.invoice}^FS` : ''}
^FO${positions.date.x},${dateY}^A0,${detailFontSize},${detailFontSize}^FD${record.print_date}^FS
^FO${positions.operator.x},${operatorY}^A0,${detailFontSize},${detailFontSize}^FD${record.operator}^FS
^FO${positions.laser.x},${laserY}^A0,${detailFontSize},${detailFontSize}^FD${record.laser}^FS
^FO${qrX},${qrY}^BQN,2,${qrMag}^FDQA,${record.box_number || record.document_id || record.id}^FS
^XZ`;
  } else {
    // Standard layout for square/tall labels
    zpl = `^XA
^PW${dims.widthDots}
${logoCommand}
^FO7,${customerY}^FB${fieldBlockWidth},1,0,R,0^A0N,${customerFontSize},${customerFontSize}^FD${record.customer}^FS
^FO7,${poY}^FB${fieldBlockWidth},1,0,R,0^A0,${poFontSize},${poFontSize}^FDPO: ${record.po}^FS
^FO0,${skuY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFontSize},${skuFontSize}^FD${record.sku}^FS
^FO0,${qtyY}^FB${dims.widthDots},1,0,C,0^A0,${qtyFontSize},${qtyFontSize}^FDPer Box: ${record.quantity}^FS
${record.invoice ? `^FO45,${invoiceY}^A0,${detailFontSize},${detailFontSize}^FDInvoice: ${record.invoice}^FS` : ''}
^FO45,${dateY}^A0,${detailFontSize},${detailFontSize}^FDDate: ${record.print_date}^FS
^FO45,${operatorY}^A0,${detailFontSize},${detailFontSize}^FDOperator: ${record.operator}^FS
^FO45,${laserY}^A0,${detailFontSize},${detailFontSize}^FDLaser: ${record.laser}^FS
^FO${qrX},${qrY}^BQN,2,${qrMag}^FDQA,${record.box_number || record.document_id || record.id}^FS
^XZ`;
  }

  return zpl.trim();
};

// Manual label ZPL generator - always shows both Bladetech and customer logos
export const generateManualZPL = (
  record: PrintedLabel, 
  customerTemplate?: Customer | null,
  labelSize?: LabelDimensions
): string => {
  // Use provided dimensions or default
  const dimensions = labelSize || DEFAULT_LABEL_SIZE;
  const dims = getLabelDimensionsDots(dimensions);
  const positions = calculateBoxLabelPositions(dimensions);
  const scale = getScaleFactor(dimensions);
  
  // Company logo always at calculated top-left position
  const companyX = positions.logo.x;
  const companyY = positions.logo.y;
  const companyLogoCommand = `^FO${companyX},${companyY}${companyLogoZPL()}`;
  
  // Customer logo positioned using template settings
  let customerLogoCommand = '';
  if (customerTemplate?.zpl_code) {
    const logoPosition = customerTemplate?.logo_position || { x: 55, y: dimensions.heightMm * 0.062, width: 48, height: 16 };
    const customerX = mmToZplDots(logoPosition.x);
    const customerY = mmToZplDots(logoPosition.y) - 16;
    
    let cleanZpl = customerTemplate.zpl_code.trim();
    cleanZpl = cleanZpl.replace(/^\^XA\s*/g, '');
    cleanZpl = cleanZpl.replace(/\s*\^XZ$/g, '');
    cleanZpl = cleanZpl.replace(/^\^FO\d+,\d+/, '');
    cleanZpl = cleanZpl.replace(/\^FS$/, '');
    
    if (cleanZpl.includes('^XA') || cleanZpl.includes('^XZ')) {
      console.warn('Customer ZPL still contains ^XA or ^XZ commands after cleaning:', cleanZpl.substring(0, 200));
    }
    
    if (!cleanZpl.includes('^GFA') && !cleanZpl.includes('^GF') && !cleanZpl.includes('^XG')) {
      console.warn('Customer ZPL does not contain recognizable graphics data:', cleanZpl.substring(0, 100));
    }
    
    customerLogoCommand = `^FO${customerX},${customerY}${cleanZpl}^FS`;
  }
  
  // Calculate font sizes based on scale
  const customerFontSize = scaleFontSize(72, dimensions);
  const poFontSize = scaleFontSize(36, dimensions);
  const skuFontSize = scaleFontSize(96, dimensions);
  const qtyFontSize = scaleFontSize(36, dimensions);
  const detailFontSize = scaleFontSize(32, dimensions);
  
  // Calculate Y positions - slightly adjusted for manual labels with two logos
  const customerTextY = positions.customer.y;
  const poTextY = positions.po.y;
  const skuTextY = positions.sku.y;
  const qtyTextY = positions.quantity.y;
  const invoiceTextY = Math.round(dims.heightDots * 0.79);
  const dateTextY = Math.round(dims.heightDots * 0.84);
  const operatorTextY = Math.round(dims.heightDots * 0.89);
  const qrX = positions.qrCode.x;
  const qrTextY = Math.round(dims.heightDots * 0.73);
  const qrMag = Math.max(2, Math.round(positions.qrCode.width || 5));
  
  const fieldBlockWidth = dims.widthDots - 30;

  // ZPL code with both logos - company and customer
  const zpl = `^XA
^PW${dims.widthDots}
${companyLogoCommand}
${customerLogoCommand}
^FO7,${customerTextY}^FB${fieldBlockWidth},1,0,R,0^A0N,${customerFontSize},${customerFontSize}^FD${record.customer}^FS
^FO7,${poTextY}^FB${fieldBlockWidth},1,0,R,0^A0,${poFontSize},${poFontSize}^FDPO: ${record.po}^FS
^FO0,${skuTextY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFontSize},${skuFontSize}^FD${record.sku}^FS
^FO0,${qtyTextY}^FB${dims.widthDots},1,0,C,0^A0,${qtyFontSize},${qtyFontSize}^FDPer Box: ${record.quantity}^FS
${record.invoice ? `^FO45,${invoiceTextY}^A0,${detailFontSize},${detailFontSize}^FDInvoice: ${record.invoice}^FS` : ''}
^FO45,${dateTextY}^A0,${detailFontSize},${detailFontSize}^FDDate: ${record.print_date}^FS
^FO45,${operatorTextY}^A0,${detailFontSize},${detailFontSize}^FDOperator: ${record.operator}^FS
^FO${qrX},${qrTextY}^BQN,2,${qrMag}^FDQA,${record.box_number || record.document_id || record.id}^FS
^XZ`;

  return zpl.trim();
};

// Company logo ZPL (same as used in pallet labels) - starts without ^FO positioning
const companyLogoZPL = () => `^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8001FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS`;

export const sendZPLToPrinter = async (zpl: string, printerIP: string = '10.0.1.90'): Promise<void> => {
  try {
    const response = await fetch(`https://${printerIP}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: zpl,
    });
    
    if (!response.ok) {
      throw new Error(`Print job failed with status: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error sending print job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
