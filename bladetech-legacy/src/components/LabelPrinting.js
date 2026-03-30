import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
  FormHelperText,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeCanvas } from 'qrcode.react';

// === FIXED ZPL GENERATORS ===
const generateBoxZPL = (data, boxNum) => {
  // For long text, extend further left but keep right-aligned
  const getCustomerX = (text) => {
    if (!text) return 15;
    if (text.length > 25) return 5;   // Start further left for very long text
    if (text.length > 20) return 10;  // Start a bit further left
    return 15; // Normal position
  };

  const getPOX = (text) => {
    if (!text) return 15;
    if (text.length > 30) return 5;   // Start further left for very long text
    if (text.length > 25) return 10;  // Start a bit further left
    return 15; // Normal position
  };

  // Calculate field width based on starting position
  const getFieldWidth = (startX) => {
    return 785 - startX; // Total width minus starting position
  };

  const customerX = getCustomerX(data.customer);
  const poX = getPOX(data.po);
  const customerWidth = getFieldWidth(customerX);
  const poWidth = getFieldWidth(poX);

  return `
^XA
^PW800
^FO15,60^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8003FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS
^FO${customerX},210^FB${customerWidth},1,0,R,0^A0N,72,72^FD${data.customer}^FS
^FO${poX},290^FB${poWidth},1,0,R,0^A0,36,36^FDPO: ${data.po}^FS
^FO0,390^FB800,1,0,C,0^A0N,96,96^FD${data.sku}^FS
^FO0,510^FB800,1,0,C,0^A0,48,48^FDQty: ${data.quantity}^FS
^FO45,670^A0,32,32^FDDate: ${data.date}^FS
^FO45,710^A0,32,32^FDOperator: ${data.operator}^FS
^FO45,750^A0,32,32^FDLaser: ${data.laser}^FS
^FO600,600^BQN,2,5^FDQA,${boxNum}^FS
^XZ
`.trim();
};

const generatePalletZPL = ({ sku, name, count, blades, date, customer, po }) => {
  console.log('=== ZPL GENERATION DEBUG ===');
  console.log('Input data:', { sku, name, count, blades, date, customer, po });
  
  // Validate required fields
  if (!sku) {
    throw new Error('SKU is required for pallet label');
  }
  if (!name) {
    throw new Error('Pallet name is required');
  }
  if (count === undefined || count === null) {
    throw new Error('Box count is required');
  }
  
  // For long text, extend further left but keep right-aligned
  const getCustomerX = (text) => {
    if (!text) return 15;
    if (text.length > 25) return 5;   // Start further left for very long text
    if (text.length > 20) return 10;  // Start a bit further left
    return 15; // Normal position
  };

  const getPOX = (text) => {
    if (!text) return 15;
    if (text.length > 30) return 5;   // Start further left for very long text
    if (text.length > 25) return 10;  // Start a bit further left
    return 15; // Normal position
  };

  // Calculate field width based on starting position
  const getFieldWidth = (startX) => {
    return 785 - startX; // Total width minus starting position
  };

  const customerX = getCustomerX(customer);
  const poX = getPOX(po);
  const customerWidth = getFieldWidth(customerX);
  const poWidth = getFieldWidth(poX);

  const zpl = `
^XA
^PW800
^FO15,60^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8003FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS
^FO${customerX},210^FB${customerWidth},1,0,R,0^A0N,72,72^FD${customer || ''}^FS
^FO${poX},290^FB${poWidth},1,0,R,0^A0,36,36^FDPO: ${po || ''}^FS
^FO0,390^FB800,1,0,C,0^A0N,96,96^FD${sku}^FS
^FO0,510^FB800,1,0,C,0^A0,48,48^FDBOXES: ${count}^FS
^FO0,570^FB800,1,0,C,0^A0,48,48^FDTOTAL BLADES: ${blades}^FS
^FO45,700^A0,32,32^FDDATE: ${date}^FS
^FO600,600^BQN,2,5^FDQA,${name}^FS
^XZ
`.trim();

  console.log('✅ ZPL generated successfully');
  return zpl;
};

// === Print functions ===
async function sendZPL(zpl, settings) {
  console.log('=== SENDING ZPL TO PRINTER ===');
  
  if (!settings || !settings.IP) {
    console.error('❌ No printer settings or IP provided:', settings);
    alert('Error: Printer IP not configured');
    return;
  }
  
  const ip = settings.IP;
  console.log('Sending to printer IP:', ip);
  console.log('ZPL length:', zpl.length, 'characters');
  
  try {
    const url = `https://${ip}/print`;
    console.log('Printer URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: zpl,
    });
    
    console.log('Printer response status:', response.status);
    console.log('Printer response ok:', response.ok);
    
    if (response.ok) {
      console.log('✅ Print sent successfully');
      alert('Label printed successfully!');
    } else {
      console.error('❌ Printer returned error:', response.status, response.statusText);
      const responseText = await response.text().catch(() => 'No response text');
      console.error('Response body:', responseText);
      alert(`Printer error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Network error sending to printer:', error);
    alert('Network error: ' + error.message + '\nCheck printer IP and network connection.');
  }
}

const printBox = (data, num, settings) =>
  sendZPL(generateBoxZPL(data, num), settings);

const printPallet = (pal, boxes, settings, perBox, date) => {
  console.log('=== PALLET PRINT DEBUG ===');
  console.log('Pallet data:', pal);
  console.log('Boxes data:', boxes);
  console.log('Settings:', settings);
  console.log('PerBox:', perBox);
  console.log('Date:', date);
  
  // Validate essential inputs
  if (!pal) {
    console.error('❌ No pallet data provided');
    alert('Error: No pallet data provided');
    return Promise.reject('No pallet data');
  }
  
  if (!pal.name) {
    console.error('❌ Pallet missing name:', pal);
    alert('Error: Pallet is missing a name');
    return Promise.reject('Pallet missing name');
  }
  
  if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
    console.error('❌ Invalid or empty boxes array:', boxes);
    alert('Error: No boxes found for this pallet');
    return Promise.reject('No boxes data');
  }
  
  // Extract data from boxes (with fallbacks)
  const firstBox = boxes[0] || {};
  const sku = firstBox.SKU || firstBox.sku || '';
  const customer = firstBox.customer || '';
  const po = pal.po || firstBox.PO || firstBox.po || '';
  
  console.log('Extracted fields:');
  console.log('- SKU:', sku);
  console.log('- Customer:', customer);
  console.log('- PO:', po);
  
  // Validate required fields
  if (!sku) {
    console.error('❌ No SKU found in boxes:', boxes);
    alert('Error: SKU is missing from box data');
    return Promise.reject('Missing SKU');
  }
  
  // Calculate totals with proper fallbacks
  const totalBoxes = pal.totalBoxes !== undefined && pal.totalBoxes !== null 
    ? pal.totalBoxes 
    : boxes.length;
    
  const calculatedBlades = boxes.length * (Number(perBox) || 0);
  const totalBlades = pal.totalBlades !== undefined && pal.totalBlades !== null 
    ? pal.totalBlades 
    : calculatedBlades;
  
  console.log('Calculated totals:');
  console.log('- Total boxes:', totalBoxes);
  console.log('- Total blades:', totalBlades);
  console.log('- PerBox amount:', perBox);
  
  // Prepare data for ZPL generation
  const palletLabelData = {
    sku,
    name: pal.name,
    count: totalBoxes,
    blades: totalBlades,
    date: date || getTodayDate(),
    customer: customer || '',
    po: po || '',
  };
  
  console.log('Final pallet label data:', palletLabelData);
  
  try {
    const zpl = generatePalletZPL(palletLabelData);
    console.log('✅ Generated ZPL successfully');
    console.log('ZPL preview:', zpl.substring(0, 200) + '...');
    return sendZPL(zpl, settings);
  } catch (error) {
    console.error('❌ Error generating pallet ZPL:', error);
    alert('Error generating pallet label: ' + error.message);
    return Promise.reject(error);
  }
};

const getTodayDate = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

function getPerBoxAmountSync(products, sku) {
  const product = products.find(p => p.id === sku);
  if (!product) return '';
  
  // Try multiple possible locations for perBoxAmount
  if (product.perBoxAmount) {
    return product.perBoxAmount;
  }
  
  // Check the revisions subcollection that we loaded
  if (product.revisionsSubcollection && Array.isArray(product.revisionsSubcollection)) {
    // Try to find the most recent revision with perBoxAmount
    const revisionWithAmount = product.revisionsSubcollection
      .filter(rev => rev.perBoxAmount)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    
    if (revisionWithAmount) {
      return revisionWithAmount.perBoxAmount;
    }
  }
  
  // Check if there's a revisions array with perBoxAmount (fallback for other structure)
  if (product.revisions && Array.isArray(product.revisions)) {
    // Try to find the most recent revision with perBoxAmount
    const revisionWithAmount = product.revisions
      .filter(rev => rev.perBoxAmount)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    
    if (revisionWithAmount) {
      return revisionWithAmount.perBoxAmount;
    }
  }
  
  // Check if there's a single revision object
  if (product.revision && product.revision.perBoxAmount) {
    return product.revision.perBoxAmount;
  }
  
  // Check if there's a currentRevision
  if (product.currentRevision && product.currentRevision.perBoxAmount) {
    return product.currentRevision.perBoxAmount;
  }
  
  // Check other possible field names
  if (product.boxAmount) {
    return product.boxAmount;
  }
  
  if (product.quantity) {
    return product.quantity;
  }
  
  // If still no value found, return empty string
  return '';
}

const LabelPreview = ({
  logo,
  customer,
  po,
  sku,
  qty,
  boxes,
  blades,
  qrValue,
  date,
  operator,
  laser,
  isPallet,
}) => {
  // Calculate dynamic positioning for long text - but keep original layout
  const getCustomerWidth = (text) => {
    if (!text) return '250px';
    if (text.length > 25) return '320px';  // Much wider for very long text
    if (text.length > 20) return '290px';  // Wider
    return '250px'; // Normal width (increased from 200px)
  };

  const getPOWidth = (text) => {
    if (!text) return '250px';
    if (text.length > 30) return '320px';  // Much wider for very long text
    if (text.length > 25) return '290px';  // Wider
    return '250px'; // Normal width (increased from 200px)
  };

  const customerWidth = getCustomerWidth(customer);
  const poWidth = getPOWidth(po);

  return (
    <Box sx={{
      width: 330,
      minHeight: 340,
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      px: 2,
      pt: 2,
      pb: 2,
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Logo row */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <img src={logo} alt="Logo" style={{ height: 40, marginRight: 8 }} />
        <Box sx={{ flexGrow: 1 }} />
      </Box>
      
      {/* Customer name row - right aligned, below logo with more spacing */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
        {customer && (
          <Typography 
            sx={{ 
              fontWeight: 600, 
              fontSize: 18,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: customerWidth,
              textAlign: 'right'
            }}
          >
            {customer}
          </Typography>
        )}
      </Box>
      
      {/* PO row - right aligned */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
        {po && (
          <Typography 
            sx={{ 
              fontSize: 16,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: poWidth,
              textAlign: 'right'
            }}
          >
            PO: {po}
          </Typography>
        )}
      </Box>
      
      <Typography sx={{ fontWeight: 700, fontSize: 36, textAlign: 'center', mb: 1 }}>{sku}</Typography>
      {isPallet ? (
        <>
          <Typography sx={{ fontSize: 24, textAlign: 'center', mb: 0.5 }}>Boxes: {boxes}</Typography>
          <Typography sx={{ fontSize: 24, textAlign: 'center', mb: 1 }}>Total Blades: {blades}</Typography>
        </>
      ) : (
        <Typography sx={{ fontSize: 24, textAlign: 'center', mb: 1 }}>Qty: {qty}</Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <QRCodeCanvas value={qrValue} size={80} />
      </Box>
      <Box sx={{ position: 'absolute', bottom: 16, left: 16 }}>
        <Typography sx={{ fontSize: 14 }}>Date: {date}</Typography>
        {!isPallet && operator && <Typography sx={{ fontSize: 14 }}>Operator: {operator}</Typography>}
        {!isPallet && laser && <Typography sx={{ fontSize: 14 }}>Laser: {laser}</Typography>}
      </Box>
    </Box>
  );
};

const PalletProgress = ({ count, max }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
    <Box sx={{ flexGrow: 1, mr: 1 }}>
      <LinearProgress
        variant="determinate"
        value={max > 0 ? (100 * count) / max : 0}
        sx={{
          height: 10, borderRadius: 5, backgroundColor: '#eee',
          '& .MuiLinearProgress-bar': { backgroundColor: '#2e7d32' }
        }}
      />
    </Box>
    <Typography variant="caption">{count} / {max}</Typography>
  </Box>
);

const POProgress = ({ current, target }) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = current >= target && target > 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 150 }}>
      <Box sx={{ flexGrow: 1, mr: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 12, 
            borderRadius: 6, 
            backgroundColor: '#eee',
            '& .MuiLinearProgress-bar': { 
              backgroundColor: isComplete ? '#4caf50' : percentage > 80 ? '#ff9800' : '#2196f3',
              transition: 'background-color 0.3s ease'
            }
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ 
        fontWeight: 'bold',
        color: isComplete ? '#4caf50' : 'inherit'
      }}>
        {current} / {target}
        {isComplete && ' ✓'}
      </Typography>
    </Box>
  );
};

const PrinterSettings = ({ settings, setSettings }) => {
  const [ip, setIp] = useState(settings?.IP || '');
  const [port, setPort] = useState(settings?.Port || 9100);
  useEffect(() => {
    setIp(settings?.IP || '');
    setPort(settings?.Port || 9100);
  }, [settings]);
  const save = async () => {
    await setDoc(doc(db, 'Printersettings', 'IP'), { IP: ip, Port: port }, { merge: true });
    setSettings({ IP: ip, Port: port });
    alert('Saved');
  };
  return (
    <Box sx={{ p: 2 }}>
      <TextField label="Printer IP" value={ip} onChange={e => setIp(e.target.value)} sx={{ mr: 2 }} />
      <TextField label="Port" type="number" value={port} onChange={e => setPort(+e.target.value)} sx={{ mr: 2 }} />
      <Button variant="contained" onClick={save}>Update</Button>
    </Box>
  );
};

export default function LabelPrinting() {
  const [POs, setPOs] = useState([]);
  const [ops, setOps] = useState([]);
  const [pset, setPset] = useState(null);
  const [products, setProducts] = useState([]);
  const [poProgress, setPOProgress] = useState({}); // Track PO progress

  // For Pallet Complete Modal
  const [showPalletComplete, setShowPalletComplete] = useState(false);
  const [completedPallet, setCompletedPallet] = useState(null);
  const [completedPalletBoxes, setCompletedPalletBoxes] = useState([]);
  const [completedPerBox, setCompletedPerBox] = useState(0);

  // For deferring the "pallet complete" modal until after box modal is closed
  const pendingPalletCompleteRef = useRef(false);
  const pendingPalletData = useRef({});

  // Add local UI states for invoices
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoicesError, setInvoicesError] = useState('');
  
  useEffect(() => {
    // only load POs where status !== true
    const poQuery = query(
      collection(db, 'CustomerPurchaseOrders'),
      where('status', '==', false)        // <-- filter out completed (status === true)
    );
    getDocs(poQuery)
      .then(snap => setPOs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      
    getDocs(collection(db, 'Operators')).then(s => setOps(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDoc(doc(db, 'Printersettings', 'IP')).then(s => setPset(s.exists() ? s.data() : { IP: '10.0.1.90', Port: 9100 }));
      
    // Load products with their revisions subcollections
    getDocs(collection(db, 'products')).then(async (snapshot) => {
      const productsWithRevisions = await Promise.all(
        snapshot.docs.map(async (productDoc) => {
          const productData = { id: productDoc.id, ...productDoc.data() };
          
          // Load revisions subcollection for this product
          try {
            const revisionsSnapshot = await getDocs(collection(db, 'products', productDoc.id, 'revisions'));
            productData.revisionsSubcollection = revisionsSnapshot.docs.map(revDoc => ({ 
              id: revDoc.id, 
              ...revDoc.data() 
            }));
          } catch (error) {
            console.log(`No revisions found for product ${productDoc.id}`);
            productData.revisionsSubcollection = [];
          }
          
          return productData;
        })
      );
      
      setProducts(productsWithRevisions);
    });
  }, []);

  // FIXED: Fetch Invoice Numbers with detailed debugging
  useEffect(() => {
    const fetchInvoiceNumbers = async () => {
      console.log('🔍 Starting invoice fetch...');
      
      try {
        setLoadingInvoices(true);
        setInvoicesError('');
        
        // Step 1: Get the collection
        const invoicesCollection = collection(db, 'Goodsin');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        
        console.log('📊 Documents found:', invoicesSnapshot.docs.length);
        
        // Step 2: Check if collection is empty
        if (invoicesSnapshot.docs.length === 0) {
          console.log('❌ No documents in Goodsin collection');
          setInvoicesError('No documents found in Goodsin collection');
          return;
        }
        
        // Step 3: Log first document to see structure
        const firstDoc = invoicesSnapshot.docs[0];
        console.log('📄 First document ID:', firstDoc.id);
        console.log('📄 First document data:', firstDoc.data());
        console.log('📄 Invoice field value:', firstDoc.data().invoice);
        
        // Step 4: Extract all invoice values
        const invoicesList = [];
        
        invoicesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const invoiceValue = data.invoice;
          
          console.log(`Doc ${index + 1}: ID=${doc.id}, invoice="${invoiceValue}"`);
          
          if (invoiceValue) {
            invoicesList.push(invoiceValue);
          }
        });
        
        console.log('📋 All invoice values found:', invoicesList);
        
        // Step 5: Remove duplicates
        const uniqueInvoices = [...new Set(invoicesList)];
        console.log('✅ Unique invoices:', uniqueInvoices);
        
        // Step 6: Update state
        setInvoiceNumbers(uniqueInvoices);
        
        if (uniqueInvoices.length === 0) {
          setInvoicesError('No invoice numbers found in documents');
        }
        
      } catch (err) {
        console.error('❌ Error fetching invoices:', err);
        setInvoicesError('Error: ' + err.message);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoiceNumbers();
  }, []);

  const blank = {
    customerPO: '', date: getTodayDate(),
    operator: '', customer: '', PO: '', invoice: '', SKU: '', quantity: '',
    selectedPalletId: '', openPalletModal: false, creatingPallet: false, newPalletBoxes: 30, openPallets: []
  };
  const [l1, setL1] = useState({ ...blank }), [l2, setL2] = useState({ ...blank });
  const [showBoxModal, setShowBoxModal] = useState(false), [boxData, setBoxData] = useState(null), [boxNum, setBoxNum] = useState('');
  const [pal, setPal] = useState(null), [pboxes, setPboxes] = useState([]), [showPalModal, setShowPalModal] = useState(false), [perBox, setPerBox] = useState(0);
  const [setOpen, setSetOpen] = useState(false);

  const loadP = async (po, setL) => {
    if (!po) return setL(f => ({ ...f, openPallets: [] }));
    const q = query(collection(db, 'Pallets'), where('isComplete', '==', false), where('po', '==', po), orderBy('createdAt'));
    const s = await getDocs(q);
    setL(f => ({ ...f, openPallets: s.docs.map(d => ({ id: d.id, ...d.data() })) }));
  };
  useEffect(() => { loadP(l1.PO, setL1); }, [l1.PO, l1.openPalletModal, l1.creatingPallet, showPalletComplete]);
  useEffect(() => { loadP(l2.PO, setL2); }, [l2.PO, l2.openPalletModal, l2.creatingPallet, showPalletComplete]);

  // Load PO progress data
  const loadPOProgress = useCallback(async () => {
    const progressData = {};
    
    for (const po of POs) {
      // Count completed boxes for this PO
      const completedBoxesQuery = query(
        collection(db, 'LabelBoxes'),
        where('PO', '==', po.po)
      );
      const completedBoxesSnap = await getDocs(completedBoxesQuery);
      const completedCount = completedBoxesSnap.docs.reduce((sum, doc) => {
        return sum + (doc.data().quantity || 0);
      }, 0);
      
      progressData[po.po] = {
        current: completedCount,
        target: po.quantity || 0
      };
    }
    
    setPOProgress(progressData);
  }, [POs]);

  useEffect(() => {
    if (POs.length > 0) {
      loadPOProgress();
    }
  }, [POs, showBoxModal, loadPOProgress]); // Reload when POs change or when box is completed

  useEffect(() => {
    if (l1.SKU && (l1.quantity === '' || l1.quantity === undefined || l1.quantity === null)) {
      setL1(f => {
        if (f.quantity === '' || f.quantity === undefined || f.quantity === null) {
          return { ...f, quantity: getPerBoxAmountSync(products, l1.SKU) };
        }
        return f;
      });
    }
  }, [l1.SKU, l1.quantity, products]);
  useEffect(() => {
    if (l2.SKU && (l2.quantity === '' || l2.quantity === undefined || l2.quantity === null)) {
      setL2(f => {
        if (f.quantity === '' || f.quantity === undefined || f.quantity === null) {
          return { ...f, quantity: getPerBoxAmountSync(products, l2.SKU) };
        }
        return f;
      });
    }
  }, [l2.SKU, l2.quantity, products]);

  const onPO = (e, setL) => {
    const id = e.target.value, d = POs.find(p => p.id === id) || {};
    setL({ ...blank, customerPO: id, PO: d.po || '', SKU: d.sku || '', customer: d.customer || '', date: getTodayDate(), quantity: '' });
  };

  const createPal = async (l, setL) => {
    if (!l.PO) return alert('Pick PO');
    setL(f => ({ ...f, creatingPallet: true }));
    const s = await getDocs(query(collection(db, 'Pallets'), where('po', '==', l.PO)));
    const num = s.docs.length + 1, name = `${l.PO}-${num}`;
    const r = await addDoc(collection(db, 'Pallets'), {
      createdAt: serverTimestamp(),
      createdBy: l.operator || 'Unknown',
      isComplete: false,
      boxNumbers: [],
      maxBoxes: +l.newPalletBoxes,
      po: l.PO,
      name,
      totalBoxes: 0,
      totalBlades: 0
    });
    setL(f => ({ ...f, selectedPalletId: r.id, openPalletModal: false, newPalletBoxes: 30, creatingPallet: false }));
  };

  // UPDATED: Box Complete workflow with Pallet Complete modal after box modal
  const completeBox = async (l, setL, type) => {
    if (!l.selectedPalletId) return alert('Select pallet');
    const { date, operator, customer, PO, SKU, invoice, quantity } = l;
    if (!date || !operator || !customer || !PO || !SKU) return alert('Fill all');
    const palDocRef = doc(db, 'Pallets', l.selectedPalletId);
    const palSnap = await getDoc(palDocRef);
    if (!palSnap.exists()) return alert('Missing pallet');
    const pal = palSnap.data();
    if (((pal.boxNumbers?.length ?? 0)) >= pal.maxBoxes) return alert('Full');
    const num = +quantity || 0;
    // Add box
    const boxRef = await addDoc(collection(db, 'LabelBoxes'), {
      laser: type, date, operator, customer, PO, invoice, SKU, quantity: num,
      createdAt: serverTimestamp(), palletId: l.selectedPalletId, po: pal.po, palletName: pal.name
    });
    // Update pallet with new boxNumbers array and new totals
    const newBoxNumbers = [...(pal.boxNumbers || []), boxRef.id];
    const perBox = getPerBoxAmountSync(products, SKU);
    const palletIsNowFull = newBoxNumbers.length >= pal.maxBoxes;
    await updateDoc(palDocRef, {
      boxNumbers: newBoxNumbers,
      totalBoxes: newBoxNumbers.length,
      totalBlades: newBoxNumbers.length * Number(perBox),
      isComplete: palletIsNowFull ? true : pal.isComplete
    });
    setBoxData({ customer, po: PO, sku: SKU, date, operator, laser: type, quantity: num });
    setBoxNum(boxRef.id);
    setShowBoxModal(true);
    setL(f => ({ ...f, invoice: '' }));

    // If pallet is now full, defer showing modal until box modal is closed
    if (palletIsNowFull) {
      const boxDocs = await Promise.all(newBoxNumbers.map(id => getDoc(doc(db, 'LabelBoxes', id))));
      const boxesArr = boxDocs.map(d => d.exists() ? d.data() : {});
      pendingPalletData.current = {
        completedPallet: { ...pal, name: pal.name, po: pal.po, maxBoxes: pal.maxBoxes },
        completedPalletBoxes: boxesArr,
        completedPerBox: Number(perBox)
      };
      pendingPalletCompleteRef.current = true;
    }
  };

  // When box modal closes, check if we need to show the pallet complete modal
  useEffect(() => {
    if (!showBoxModal && pendingPalletCompleteRef.current) {
      const { completedPallet, completedPalletBoxes, completedPerBox } = pendingPalletData.current;
      setCompletedPallet(completedPallet);
      setCompletedPalletBoxes(completedPalletBoxes);
      setCompletedPerBox(completedPerBox);
      setShowPalletComplete(true);
      pendingPalletCompleteRef.current = false;
      pendingPalletData.current = {};
    }
  }, [showBoxModal]);

  const quickPal = async (p) => {
    const palletSnap = await getDoc(doc(db, 'Pallets', p.id));
    const pallet = palletSnap.data();
    const docs = await Promise.all(((pallet.boxNumbers) || []).map(id => getDoc(doc(db, 'LabelBoxes', id))));
    const arr = docs.map(d => d.exists() ? d.data() : {});
    setPal({ ...p, ...pallet });
    setPboxes(arr);
    const skus = [...new Set(arr.map(b => b.SKU).filter(Boolean))];
    if (skus[0]) setPerBox(getPerBoxAmountSync(products, skus[0]));
    setShowPalModal(true);
  };

  const LaserForm = ({ l, setL, type }) => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">{type} Details</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Customer PO</InputLabel>
        <Select value={l.customerPO} onChange={e => onPO(e, setL)}>
          <MenuItem value=""><em>None</em></MenuItem>
          {POs.map(p => (
            <MenuItem key={p.id} value={p.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography>{p.po} — {p.customer}</Typography>
                {poProgress[p.po] && (
                  <POProgress 
                    current={poProgress[p.po].current} 
                    target={poProgress[p.po].target} 
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField label="Customer" value={l.customer} fullWidth InputProps={{ readOnly: true }} sx={{ mb: 1 }} />
      <TextField label="SKU" value={l.SKU} fullWidth InputProps={{ readOnly: true }} sx={{ mb: 1 }} />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Pallet</InputLabel>
        <Select value={l.selectedPalletId} onChange={e => setL(f => ({ ...f, selectedPalletId: e.target.value }))}>
          {l.openPallets.length === 0
            ? <MenuItem value=""><em>No open pallets</em></MenuItem>
            : l.openPallets.map(p =>
              <MenuItem key={p.id} value={p.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {p.name} ({((p.totalBoxes ?? p.boxNumbers?.length) || 0)}/{p.maxBoxes})
                  <PalletProgress count={((p.totalBoxes ?? p.boxNumbers?.length) || 0)} max={p.maxBoxes} />
                </Box>
              </MenuItem>
            )
          }
        </Select>
        <Button size="small" variant="outlined" sx={{ mt: 1 }}
          onClick={() => setL(f => ({ ...f, openPalletModal: true }))}
          disabled={!l.PO}>Create New Pallet</Button>
      </FormControl>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="Date" type="date" fullWidth value={l.date}
            onChange={e => setL(f => ({ ...f, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Operator</InputLabel>
            <Select value={l.operator} onChange={e => setL(f => ({ ...f, operator: e.target.value }))}>
              <MenuItem value=""><em>None</em></MenuItem>
              {ops.map(o => <MenuItem key={o.id} value={o.initials}>{o.Name || o.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth error={Boolean(invoicesError)}>
            <InputLabel>Invoice Number</InputLabel>
            <Select
              value={l.invoice}
              label="Invoice Number"
              onChange={e => setL(f => ({ ...f, invoice: e.target.value }))}
              disabled={loadingInvoices || Boolean(invoicesError)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {loadingInvoices ? (
                <MenuItem value="" disabled>
                  <em>Loading invoices...</em>
                </MenuItem>
              ) : invoicesError ? (
                <MenuItem value="" disabled>
                  <em>Error: {invoicesError}</em>
                </MenuItem>
              ) : invoiceNumbers.length === 0 ? (
                <MenuItem value="" disabled>
                  <em>No invoices available</em>
                </MenuItem>
              ) : (
                invoiceNumbers.map((inv) => (
                  <MenuItem key={inv} value={inv}>
                    {inv}
                  </MenuItem>
                ))
              )}
            </Select>
            {loadingInvoices && (
              <FormHelperText>Loading invoices...</FormHelperText>
            )}
            {invoicesError && (
              <FormHelperText error>{invoicesError}</FormHelperText>
            )}
            {!loadingInvoices && !invoicesError && (
              <FormHelperText>
                {invoiceNumbers.length} invoice{invoiceNumbers.length !== 1 ? 's' : ''} available
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField label="Quantity" type="number" fullWidth
            value={l.quantity} onChange={e => setL(f => ({ ...f, quantity: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
      <Button variant="contained" sx={{ mt: 2 }}
        onClick={() => completeBox(l, setL, type)}
      >Complete Box ({type})</Button>
      <Dialog open={l.openPalletModal} onClose={() => setL(f => ({ ...f, openPalletModal: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Pallet</DialogTitle>
        <DialogContent>
          <TextField label="PO Number" fullWidth disabled value={l.PO} sx={{ mt: 2, mb: 2 }} />
          <TextField label="Boxes per Pallet" type="number" fullWidth
            value={l.newPalletBoxes} onChange={e => setL(f => ({ ...f, newPalletBoxes: e.target.value }))}
            inputProps={{ min: 1, max: 999 }} sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Operator</InputLabel>
            <Select value={l.operator} onChange={e => setL(f => ({ ...f, operator: e.target.value }))}>
              {ops.map(o => <MenuItem key={o.id} value={o.initials}>{o.Name || o.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" fullWidth
            onClick={() => createPal(l, setL)}
            disabled={l.creatingPallet || !l.newPalletBoxes}
          >
            {l.creatingPallet ? <CircularProgress size={22} /> : 'Create Pallet'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setL(f => ({ ...f, openPalletModal: false }))}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );

  // Pallet Complete Modal (after box modal closes, if pallet is full)
  const PalletCompleteModal = () => {
    if (!showPalletComplete || !completedPallet) return null;
    const date = getTodayDate();
    return (
      <Dialog open={showPalletComplete} onClose={() => setShowPalletComplete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pallet Complete</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            This pallet is now full and has been marked complete. Print the pallet label:
          </Typography>
          <LabelPreview
            logo="/images/BT.jpg"
            customer={completedPalletBoxes[0]?.customer}
            po={completedPallet?.po}
            sku={completedPalletBoxes[0]?.SKU || ''}
            boxes={completedPallet?.maxBoxes}
            blades={completedPallet?.maxBoxes * completedPerBox}
            qrValue={`QA,${completedPallet?.name || ''}`}
            date={date}
            isPallet
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              console.log('Pallet Complete Print - Data:', { completedPallet, completedPalletBoxes, completedPerBox });
              printPallet(
                completedPallet,
                completedPalletBoxes,
                pset,
                completedPerBox,
                date
              );
            }}
          >
            Print Pallet Label
          </Button>
          <Button onClick={() => setShowPalletComplete(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const PalletModal = () => {
    const date = getTodayDate();
    return (
      <Dialog open={showPalModal} onClose={() => setShowPalModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pallet Label Preview</DialogTitle>
        <DialogContent>
          <LabelPreview
            logo="/images/BT.jpg"
            customer={pboxes[0]?.customer}
            po={pal?.po}
            sku={pboxes[0]?.SKU || ''}
            boxes={(pal?.totalBoxes ?? pboxes.length) || 0}
            blades={(pal?.totalBlades ?? (pboxes.length * perBox)) || 0}
            qrValue={`QA,${pal?.name || ''}`}
            date={date}
            isPallet
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              console.log('Quick Pallet Print - Data:', { pal, pboxes, perBox });
              printPallet(pal, pboxes, pset, perBox, date);
            }}
          >
            Print Pallet Label
          </Button>
          <Button onClick={() => setShowPalModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const BoxModal = () => (
    <Dialog open={showBoxModal} onClose={() => setShowBoxModal(false)} maxWidth="lg">
      <DialogTitle>Confirm Box Label</DialogTitle>
      <DialogContent>
        {boxData &&
          <LabelPreview
            logo="/images/BT.jpg"
            customer={boxData.customer}
            po={boxData.po}
            sku={boxData.sku}
            qty={boxData.quantity}
            qrValue={`QA,${boxNum}`}
            date={boxData.date}
            operator={boxData.operator}
            laser={boxData.laser}
            isPallet={false}
          />
        }
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => printBox(boxData, boxNum, pset)}
        >
          Print Label
        </Button>
        <Button onClick={() => setShowBoxModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button variant="outlined" onClick={() => setSetOpen(true)}>Printer Settings</Button>
      <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>Label Printing</Typography>
      
      {/* PO Progress Summary - Only show selected POs */}
      {(l1.PO || l2.PO) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Purchase Order Progress</Typography>
          <Grid container spacing={2}>
            {[l1.PO, l2.PO].filter(Boolean).filter((po, index, arr) => arr.indexOf(po) === index).map((poNumber) => {
              const progress = poProgress[poNumber];
              const po = POs.find(p => p.po === poNumber);
              if (!progress || !po) return null;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={poNumber}>
                  <Paper sx={{ p: 2, backgroundColor: progress.current >= progress.target ? '#f1f8e9' : '#fafafa' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {poNumber} - {po?.customer}
                    </Typography>
                    <POProgress current={progress.current} target={progress.target} />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}><LaserForm l={l1} setL={setL1} type="Laser1" /></Grid>
        <Grid item xs={12} sm={6}><LaserForm l={l2} setL={setL2} type="Laser2" /></Grid>
      </Grid>
      {[l1, l2].map((l, i) => l.PO && l.openPallets.length > 0 &&
        <Box key={i} sx={{ my: 3 }}>
          <Typography variant="h6">Open Pallets for PO {l.PO} ({i ? 'Laser2' : 'Laser1'})</Typography>
          {l.openPallets.map(p =>
            <Paper key={p.id} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography>{p.name}</Typography>
                <PalletProgress count={((p.totalBoxes ?? p.boxNumbers?.length) || 0)} max={p.maxBoxes} />
              </Box>
              <Tooltip title="Print Pallet Label">
                <IconButton disabled={!((p.totalBoxes ?? p.boxNumbers?.length) || 0)} onClick={() => quickPal(p)}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </Paper>
          )}
        </Box>
      )}
      <Dialog open={setOpen} onClose={() => setSetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Printer Settings</DialogTitle>
        <DialogContent><PrinterSettings settings={pset} setSettings={setPset} /></DialogContent>
        <DialogActions><Button onClick={() => setSetOpen(false)}>Close</Button></DialogActions>
      </Dialog>
      <BoxModal />
      <PalletModal />
      <PalletCompleteModal />
    </Container>
  );
}