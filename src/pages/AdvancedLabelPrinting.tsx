import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { getLabelDimensionsDots, scaleFontSize } from '@/utils/labelScaling';
import { 
  Printer, 
  Eye, 
  Settings, 
  QrCode, 
  Tags, 
  Package, 
  Plus,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface BoxData {
  id: string;
  customer: string;
  PO: string;
  SKU: string;
  quantity: number;
  date: string;
  operator: string;
  laser: string;
  pallet?: string;
}

interface PalletData {
  name: string;
  po: string;
  totalBoxes: number;
  totalBlades: number;
}

interface PrinterSettings {
  IP: string;
  Port: string;
}

interface ProductData {
  id: string;
  sku: string;
  name: string;
  perBoxAmount: number;
}

// ZPL Generation Functions with configurable dimensions
const generateBoxZPL = (data: BoxData, boxNum: string, labelWidth: number, labelHeight: number) => {
  const dimensions = { widthMm: labelWidth, heightMm: labelHeight };
  const dims = getLabelDimensionsDots(dimensions);
  
  const getCustomerX = (text: string) => {
    if (!text) return 15;
    if (text.length > 25) return 5;
    if (text.length > 20) return 10;
    return 15;
  };

  const getPOX = (text: string) => {
    if (!text) return 15;
    if (text.length > 30) return 5;
    if (text.length > 25) return 10;
    return 15;
  };

  const getFieldWidth = (startX: number) => {
    return dims.widthDots - 15 - startX;
  };

  const customerX = getCustomerX(data.customer);
  const poX = getPOX(data.PO);
  const customerWidth = getFieldWidth(customerX);
  const poWidth = getFieldWidth(poX);

  // Calculate scaled positions
  const customerY = Math.round(dims.heightDots * 0.26);
  const poY = Math.round(dims.heightDots * 0.36);
  const skuY = Math.round(dims.heightDots * 0.48);
  const qtyY = Math.round(dims.heightDots * 0.63);
  const dateY = Math.round(dims.heightDots * 0.83);
  const operatorY = Math.round(dims.heightDots * 0.88);
  const laserY = Math.round(dims.heightDots * 0.93);
  const qrY = Math.round(dims.heightDots * 0.75);
  const qrX = Math.round(dims.widthDots * 0.75);

  // Scale font sizes
  const customerFont = scaleFontSize(72, dimensions);
  const poFont = scaleFontSize(36, dimensions);
  const skuFont = scaleFontSize(96, dimensions);
  const qtyFont = scaleFontSize(48, dimensions);
  const detailsFont = scaleFontSize(32, dimensions);

  return `
^XA
^PW${dims.widthDots}
^FO15,60^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8003FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS
^FO${customerX},${customerY}^FB${customerWidth},1,0,R,0^A0N,${customerFont},${customerFont}^FD${data.customer}^FS
^FO${poX},${poY}^FB${poWidth},1,0,R,0^A0,${poFont},${poFont}^FDPO: ${data.PO}^FS
^FO0,${skuY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFont},${skuFont}^FD${data.SKU}^FS
^FO0,${qtyY}^FB${dims.widthDots},1,0,C,0^A0,${qtyFont},${qtyFont}^FDQty: ${data.quantity}^FS
^FO45,${dateY}^A0,${detailsFont},${detailsFont}^FDDate: ${data.date}^FS
^FO45,${operatorY}^A0,${detailsFont},${detailsFont}^FDOperator: ${data.operator}^FS
^FO45,${laserY}^A0,${detailsFont},${detailsFont}^FDLaser: ${data.laser}^FS
^FO${qrX},${qrY}^BQN,2,5^FDQA,${boxNum}^FS
^XZ
`.trim();
};

const generatePalletZPL = (data: PalletData, customer: string, sku: string, date: string, labelWidth: number, labelHeight: number) => {
  const dimensions = { widthMm: labelWidth, heightMm: labelHeight };
  const dims = getLabelDimensionsDots(dimensions);
  
  const getCustomerX = (text: string) => {
    if (!text) return 15;
    if (text.length > 25) return 5;
    if (text.length > 20) return 10;
    return 15;
  };

  const getPOX = (text: string) => {
    if (!text) return 15;
    if (text.length > 30) return 5;
    if (text.length > 25) return 10;
    return 15;
  };

  const getFieldWidth = (startX: number) => {
    return dims.widthDots - 15 - startX;
  };

  const customerX = getCustomerX(customer);
  const poX = getPOX(data.po);
  const customerWidth = getFieldWidth(customerX);
  const poWidth = getFieldWidth(poX);

  // Calculate scaled positions
  const customerY = Math.round(dims.heightDots * 0.26);
  const poY = Math.round(dims.heightDots * 0.36);
  const skuY = Math.round(dims.heightDots * 0.48);
  const boxesY = Math.round(dims.heightDots * 0.63);
  const bladesY = Math.round(dims.heightDots * 0.71);
  const dateY = Math.round(dims.heightDots * 0.87);
  const qrY = Math.round(dims.heightDots * 0.75);
  const qrX = Math.round(dims.widthDots * 0.75);

  // Scale font sizes
  const customerFont = scaleFontSize(72, dimensions);
  const poFont = scaleFontSize(36, dimensions);
  const skuFont = scaleFontSize(96, dimensions);
  const infoFont = scaleFontSize(48, dimensions);
  const dateFont = scaleFontSize(32, dimensions);

  return `
^XA
^PW${dims.widthDots}
^FO15,60^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8003FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS
^FO${customerX},${customerY}^FB${customerWidth},1,0,R,0^A0N,${customerFont},${customerFont}^FD${customer}^FS
^FO${poX},${poY}^FB${poWidth},1,0,R,0^A0,${poFont},${poFont}^FDPO: ${data.po}^FS
^FO0,${skuY}^FB${dims.widthDots},1,0,C,0^A0N,${skuFont},${skuFont}^FD${sku}^FS
^FO0,${boxesY}^FB${dims.widthDots},1,0,C,0^A0,${infoFont},${infoFont}^FDBOXES: ${data.totalBoxes}^FS
^FO0,${bladesY}^FB${dims.widthDots},1,0,C,0^A0,${infoFont},${infoFont}^FDTOTAL BLADES: ${data.totalBlades}^FS
^FO45,${dateY}^A0,${dateFont},${dateFont}^FDDATE: ${date}^FS
^FO${qrX},${qrY}^BQN,2,5^FDQA,${data.name}^FS
^XZ
`.trim();
};

export default function AdvancedLabelPrinting() {
  const { toast } = useToast();
  const { printerSettings } = usePrinterSettings();
  // State management
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [pallets, setPallets] = useState<PalletData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [machines, setMachines] = useState<string[]>([]);
  
  // Form states
  const [boxForm, setBoxForm] = useState<Partial<BoxData>>({
    customer: '',
    PO: '',
    SKU: '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    operator: '',
    laser: '',
  });
  
  const [palletForm, setPalletForm] = useState<Partial<PalletData>>({
    name: '',
    po: '',
    totalBoxes: 0,
    totalBlades: 0,
  });
  
  const [localPrinterSettings, setLocalPrinterSettings] = useState<PrinterSettings>({
    IP: '10.0.1.90',
    Port: '9100',
  });
  
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load products with box_amount
      const { data: productsData } = await supabase
        .from('products')
        .select('id, product_code, product_name, box_amount')
        .order('product_code');
      
      if (productsData) {
        setProducts(productsData.map(p => ({
          id: p.product_code,
          sku: p.product_code,
          name: p.product_name,
          perBoxAmount: p.box_amount || 100
        })));
      }

      // Load operators
      const { data: operatorsData } = await supabase
        .from('operators')
        .select('*')
        .eq('active', true)
        .order('operator_name');
      
      if (operatorsData) {
        setOperators(operatorsData.map(o => o.operator_name));
      }

      // Load machines
      const { data: machinesData } = await supabase
        .from('machines')
        .select('*')
        .eq('active', true)
        .order('machine_name');
      
      if (machinesData) {
        setMachines(machinesData.map(m => m.machine_name));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load reference data",
        variant: "destructive",
      });
    }
  };

  const sendZPLToPrinter = async (zpl: string) => {
    try {
      const response = await fetch(`http://${localPrinterSettings.IP}:${localPrinterSettings.Port}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: zpl,
      });

      if (response.ok) {
        toast({
          title: "Print Success",
          description: "Label sent to printer successfully",
        });
      } else {
        throw new Error(`Print failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: `Failed to send to printer: ${error}`,
        variant: "destructive",
      });
    }
  };

  const addBox = () => {
    if (!boxForm.customer || !boxForm.PO || !boxForm.SKU || !boxForm.quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newBox: BoxData = {
      id: Date.now().toString(),
      customer: boxForm.customer || '',
      PO: boxForm.PO || '',
      SKU: boxForm.SKU || '',
      quantity: boxForm.quantity || 0,
      date: boxForm.date || new Date().toISOString().split('T')[0],
      operator: boxForm.operator || '',
      laser: boxForm.laser || '',
    };

    setBoxes(prev => [...prev, newBox]);
    
    // Reset form
    setBoxForm({
      customer: boxForm.customer, // Keep customer
      PO: boxForm.PO, // Keep PO
      SKU: boxForm.SKU, // Keep SKU
      quantity: boxForm.quantity, // Keep quantity
      date: new Date().toISOString().split('T')[0],
      operator: boxForm.operator, // Keep operator
      laser: boxForm.laser, // Keep laser
    });

    toast({
      title: "Success",
      description: "Box added successfully",
    });
  };

  const removeBox = (id: string) => {
    setBoxes(prev => prev.filter(box => box.id !== id));
    setSelectedBoxes(prev => prev.filter(boxId => boxId !== id));
  };

  const printSelectedBoxes = () => {
    const boxesToPrint = boxes.filter(box => selectedBoxes.includes(box.id));
    
    boxesToPrint.forEach((box, index) => {
      setTimeout(() => {
        const zpl = generateBoxZPL(box, `BOX-${index + 1}`, printerSettings.labelWidth, printerSettings.labelHeight);
        sendZPLToPrinter(zpl);
      }, index * 1000); // Delay between prints
    });
  };

  const createPalletFromBoxes = () => {
    if (selectedBoxes.length === 0) {
      toast({
        title: "Selection Error",
        description: "Please select boxes to create a pallet",
        variant: "destructive",
      });
      return;
    }

    const selectedBoxData = boxes.filter(box => selectedBoxes.includes(box.id));
    const firstBox = selectedBoxData[0];
    
    // Calculate totals
    const totalBlades = selectedBoxData.reduce((sum, box) => {
      const product = products.find(p => p.sku === box.SKU);
      return sum + (product?.perBoxAmount || 0);
    }, 0);

    const newPallet: PalletData = {
      name: `PALLET-${Date.now()}`,
      po: firstBox.PO,
      totalBoxes: selectedBoxes.length,
      totalBlades: totalBlades,
    };

    setPallets(prev => [...prev, newPallet]);
    
    toast({
      title: "Success",
      description: `Pallet created with ${selectedBoxes.length} boxes`,
    });
  };

  const printPallet = (pallet: PalletData) => {
    // Get customer and SKU from first box in the same PO
    const relatedBox = boxes.find(box => box.PO === pallet.po);
    const customer = relatedBox?.customer || '';
    const sku = relatedBox?.SKU || '';
    const date = new Date().toISOString().split('T')[0];

    const zpl = generatePalletZPL(pallet, customer, sku, date, printerSettings.labelWidth, printerSettings.labelHeight);
    sendZPLToPrinter(zpl);
  };

  const exportData = () => {
    const data = { boxes, pallets };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.boxes) setBoxes(data.boxes);
        if (data.pallets) setPallets(data.pallets);
        
        toast({
          title: "Success",
          description: "Data imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Invalid file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Label Printing</h1>
          <p className="text-muted-foreground">
            Professional label printing with box and pallet management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </div>
      </div>

      <Tabs defaultValue="boxes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="boxes">Box Labels</TabsTrigger>
          <TabsTrigger value="pallets">Pallet Labels</TabsTrigger>
          <TabsTrigger value="queue">Print Queue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="boxes" className="space-y-6">
          {/* Box Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Add Box Label
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Input
                    id="customer"
                    value={boxForm.customer || ''}
                    onChange={(e) => setBoxForm(prev => ({ ...prev, customer: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="po">Purchase Order *</Label>
                  <Input
                    id="po"
                    value={boxForm.PO || ''}
                    onChange={(e) => setBoxForm(prev => ({ ...prev, PO: e.target.value }))}
                    placeholder="PO number"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Select
                    value={boxForm.SKU || ''}
                    onValueChange={(value) => setBoxForm(prev => ({ ...prev, SKU: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SKU" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.sku}>
                          {product.sku} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={boxForm.quantity || ''}
                    onChange={(e) => setBoxForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select
                    value={boxForm.operator || ''}
                    onValueChange={(value) => setBoxForm(prev => ({ ...prev, operator: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map(operator => (
                        <SelectItem key={operator} value={operator}>
                          {operator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="laser">Machine/Laser</Label>
                  <Select
                    value={boxForm.laser || ''}
                    onValueChange={(value) => setBoxForm(prev => ({ ...prev, laser: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map(machine => (
                        <SelectItem key={machine} value={machine}>
                          {machine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addBox}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Box
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Boxes List */}
          <Card>
            <CardHeader>
              <CardTitle>Box Queue ({boxes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {boxes.length === 0 ? (
                <p className="text-muted-foreground">No boxes added yet</p>
              ) : (
                <div className="space-y-2">
                  {boxes.map(box => (
                    <div key={box.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedBoxes.includes(box.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBoxes(prev => [...prev, box.id]);
                            } else {
                              setSelectedBoxes(prev => prev.filter(id => id !== box.id));
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{box.customer} - {box.PO}</p>
                          <p className="text-sm text-muted-foreground">
                            {box.SKU} × {box.quantity} | {box.operator} | {box.laser}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeBox(box.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pallets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pallet Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={createPalletFromBoxes}
                  disabled={selectedBoxes.length === 0}
                >
                  Create Pallet from Selected Boxes
                </Button>
              </div>
              
              {pallets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Created Pallets</h3>
                  {pallets.map((pallet, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{pallet.name}</p>
                        <p className="text-sm text-muted-foreground">
                          PO: {pallet.po} | Boxes: {pallet.totalBoxes} | Blades: {pallet.totalBlades}
                        </p>
                      </div>
                      <Button onClick={() => printPallet(pallet)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Print Queue Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={printSelectedBoxes}
                  disabled={selectedBoxes.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Selected Boxes ({selectedBoxes.length})
                </Button>
              </div>
              
              {selectedBoxes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Selected for Printing:</h3>
                  <div className="space-y-1">
                    {selectedBoxes.map(boxId => {
                      const box = boxes.find(b => b.id === boxId);
                      return box ? (
                        <Badge key={boxId} variant="secondary">
                          {box.customer} - {box.SKU}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Printer Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printer-ip">Printer IP Address</Label>
                  <Input
                    id="printer-ip"
                    value={localPrinterSettings.IP}
                    onChange={(e) => setLocalPrinterSettings(prev => ({ ...prev, IP: e.target.value }))}
                    placeholder="10.0.1.90"
                  />
                </div>
                <div>
                  <Label htmlFor="printer-port">Printer Port</Label>
                  <Input
                    id="printer-port"
                    value={localPrinterSettings.Port}
                    onChange={(e) => setLocalPrinterSettings(prev => ({ ...prev, Port: e.target.value }))}
                    placeholder="9100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}