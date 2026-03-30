// src/components/PrintedBoxesRecord.js

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeCanvas } from 'qrcode.react';

// --- Utility Functions ---

const generateZPL = (record) => {
  // Match label style, QR uses the record ID
  return `
^XA
^PW800
^FO15,210^FB770,1,0,R,0^A0N,72,72^FD${record.customer}^FS
^FO15,290^FB770,1,0,R,0^A0,36,36^FDPO: ${record.PO}^FS
^FO15,330^FB770,1,0,R,0^A0,32,32^FDInvoice: ${record.invoice || 'N/A'}^FS
^FO0,390^FB800,1,0,C,0^A0N,96,96^FD${record.SKU}^FS
^FO0,510^FB800,1,0,C,0^A0,48,48^FDQty: ${record.quantity}^FS
^FO45,670^A0,32,32^FDDate: ${record.date}^FS
^FO45,710^A0,32,32^FDOperator: ${record.operator}^FS
^FO45,750^A0,32,32^FDLaser: ${record.laser}^FS
^FO600,600^BQN,2,5^FDQA,${record.id}^FS
^FO50,50^GFA,10582,10582,74,S01JFC,S03JFC,S07JFO02,S0JFEO06,R01JFCO0C,R03JF8N018,R07JFO03,R0JFEO06,Q01JFCO0C,I0LF003JF8N018,I0KFE007JF01F8K03,I0KFC00JFE03FF8J06,I0KF801JFC07FFEJ0C,I0KF003JF80JF80018,I0JFE007JF01JFE003,I0JFC00JFE03KF806,I0JF801JFC07KFC0E,I0JF003JF80LFC1F,I0IFE007JF01LF83F8,I0IFC00JFE03LF07FC,I0IF801JFC07KFE0FFC,I0IF003JF80LFC1FFE,I0FFE007JF01LF83FFE,I0FFC00IF8003LF07IF,I0FF801IF8007KFE0JF,I0FF003IF800LFC1JF8,I0FE007IF801LF83JF8,I0FC00JF803LF07JF8,I0F801JF807KFE0KFCkH0FF,I0F003JF80LFC1KFCP07IFCN07ER03FO07IFCO0KFEL0LFCL0KFEN07FFEN07CI07E,I0E007JF01LF83KFCP07JF8M07ER07FO07JF8N0KFEL0LFCL0KFEM01JF8M07CI07E,I0C00JFE03LF07KFCP07JFCM07ER07F8N07JFEN0KFEL0LFCL0KFEM03JFCM07CI07E,I0801JFCM060CKFCP07JFEM07ER07F8N07KFN0KFEL0LFCL0KFEM07FC3FEM07CI07E,K01JF8N018KFCP07C00FFM07ER0FFCN07F03FF8M0KFEL0LFCL0KFEM0FE00FFM07CI07E,K01JFO030KFCO01F8003FM07ER0FFCN07E003FCM0FCR03FO0F8P01FC003FM07CI07E,K01IFEO060KFCP0F8001F8L07EQ01F3CN07EI0FEM0FCR03FO0F8P01F8003F8L07CI07E,K01IFCO0C0KFCO01F8001F8L07EQ01F3EN07EI07EM0FCR03FO0F8P03FI01F8L07CI07E,K01IF8N0180KFCO01F8001F8L07EQ01F3EN07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,K01IFO0300KFCO01F8001F8L07EQ03E3FN07EI03FM0FCR03FO0F8P07EJ0F8L07CI07E,K01FFEO0600KFCO01F8001FM07EQ03E1FN07EI03FM0FCR03FO0F8P07ER07CI07E,K01FFCO0C01KFCO01F8001FM07EQ03E1FN07EI01FM0FCR03FO0F8P07ER07CI07E,K01FF8N01803KFCO01F8003EM07EQ07C1F8M07EI01F8L0FCR03FO0F8P07CR07EI0FE,K01FFO03007KFCO01FC00FCM07EQ07C0F8M07EI01F8L0KFCN03FO0KFCL07CR07KFE,K01FEO0600LFCO01KF8M07EQ0FC0FCM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FCO0EEMF8O01KFCM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01F8N01OF8O01KFEM07EQ0F807CM07EI01F8L0KFCN03FO0KFCL0FCR07KFE,K01FO03OF8O01FC007FM07EP01F007EM07EI01F8L0FCR03FO0FCP0FCR07EI0FE,K01E02M07OFP01F8001F8L07EP01F003EM07EI01F8L0FCR03FO0F8P07CR07CI07E,K01C06M0PFP01F8I0F8L07EP03JFEM07EI01F8L0FCR03FO0F8P07CR07CI07E,K0180EL01OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,K0101EL03OFEP01F8I0FCL07EP03KFM07EI01FM0FCR03FO0F8P07EJ0F8L07CI07E,M03EL07OFCP01F8I0FCL07EP07KF8L07EI03FM0FCR03FO0F8P03EI01F8L07CI07E,M07EL0PFCP01F8I0FCL07EP07E001F8L07EI03FM0FCR03FO0F8P03FI01F8L07CI07E,M0FEK01PFCP01F8I0FCL07EP07CI0F8L07EI07EM0FCR03FO0F8P03FI03FM07CI07E,L01FEK03PFEP01F8I0FCL07EP0FCI0FCL07EI0FEM0FCR03FO0F8P01F8003FM07CI07E,L03FEK07QFP01F8001F8L07EP0F8I0FCL07E003FCM0FCR03FO0F8Q0FC007EM07CI07E,L07FEK0RF8O01F8007F8L07JFEK01F8I07EL07E01FF8M0KFEN03FO0KFEM0FF01FEM07CI07E,L0FFEJ01RFCO01LFM07JFEK01F8I07EL07KFN0KFEN03FO0KFEM07JFCM07CI07E,K01FFEJ03RFCO01KFEM07JFEK01FJ07EL07JFEN0KFEN03FO0KFEM01JF8M07CI07E,K03FFEJ07RFEO01KFCM07JFEK03FJ03FL07JFCN0KFEN03FO0KFEN0IFEN07CI07E,K07FFEJ0TFP0JFEN07JFEK03FJ03FL07IFEO0KFEN03FO0KFEN03FF8N07CI07E,K0IFEI01TFkH038,J01IFEI03TF8,J03IFEI07TF8,J07IFEI0UF8,J0JFE001UFC,I01JFE0033TFC,I03JFE006O0LFC,I07JFE00CO03KFE,I07JFE018O01KFEiH0F8,I07JFE03Q0KFEiG03FE018W018P0FFCP0E,I07JFE06Q0KFEiG070E018W018P0E1EP06,I07JFE0CQ07JFEiG0607018W018P0E07,I07JFC18Q07JFEiG06I019C001C0062023K019C00C0CJ0E03001C001C00400310046,I07JF83R07JFEiG07I01FF007F006E03FCJ01FF00E1CJ0E03007F007F00E00FF80FF8,I07JF07R07JFEiG07C001E70063807E038EJ01E300E18J0E0380E380E380E01C70071C,I07IFE0FR07JFEiG03F801C300E180700307J01C180618J0E0380C180E180E01830061C,I07IFC1FR07JFEiH07E0183I0180700303J018180738J0E0380C1807I0E03830060C,I07IF83FR0KFEiI0F0183001F80600303J01818073K0E0381FFC07E00E03030060C,I07IF07FR0KFEiG0C070183007F80600303J01818033K0E0301CJ0F80E03030060C,I07FFE0FFQ01KFEiG0E07018300E180600303J0181803FK0E0701CJ0180E03830060C,I07FFC1FFQ03KFEiG0E07018300C180600307J01C1801EK0E0700C180E1C0E01870060C,I07FF83FFQ07KFCiG070E018300E380600386J01E3801EK0E1E00E380E180E01EF0060C,I07FF07FFP03LFCiG03FC018300FFC060037EJ01BF001CK0FF8007F007F00E00FB0060C,I07FE0gFCiH0FM038CJ0338K01CI0CP01C001EL03,I07FC1gF8iW03Q01Cg0183,I07F83gF8iW03Q018g01C7,I07F07gF8iW03Q078gG0FE,I07E0gGFjP06gH03,I0781gGF,I0703gFE,I0607gFC,I060gGFC,J01gGF8,J01gGF,J03gFE,J0gGFC,I01BgF8,I033gF,I063YFE,I0C3YFC,00183YF,00303XFC,00603XF,00C03WF8,018,03,06,0C,18,3,6,C,,:::::::::::::::::::::::::::::^FS
^XZ
  `.trim();
};

const sendZPLToPrinter = async (zpl, printerSettings) => {
  const PRINTER_IP = printerSettings?.IP || '10.0.1.90';
  try {
    const response = await fetch(`https://${PRINTER_IP}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: zpl,
    });
    if (response.ok) {
      alert('Reprint job sent successfully.');
    } else {
      alert('Failed to send print job. Status: ' + response.status);
    }
  } catch (err) {
    alert('Error sending print job: ' + err.message);
  }
};

// --- Main PrintedBoxesRecord Component ---

const PrintedBoxesRecord = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [printerSettings, setPrinterSettings] = useState(null);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Fetch records from Firestore
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'LabelBoxes'));
        const fetched = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setRecords(
          fetched.sort((a, b) => {
            // Sort descending by createdAt timestamp
            if (a.createdAt && b.createdAt) {
              return b.createdAt.seconds - a.createdAt.seconds;
            }
            return 0;
          })
        );
      } catch (err) {
        alert('Failed to load records: ' + err.message);
      }
    };
    fetchRecords();
  }, []);

  // Fetch printer settings
  useEffect(() => {
    const fetchPrinterSettings = async () => {
      try {
        const settingsDoc = doc(db, 'Printersettings', 'IP');
        const docSnap = await getDoc(settingsDoc);
        if (docSnap.exists()) {
          setPrinterSettings(docSnap.data());
        } else {
          setPrinterSettings({ IP: '10.0.1.90', Port: 9100 });
        }
      } catch (err) {
        setPrinterSettings({ IP: '10.0.1.90', Port: 9100 });
      }
    };
    fetchPrinterSettings();
  }, []);

  // Search by Document ID
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a Document ID to search');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const docRef = doc(db, 'LabelBoxes', searchQuery.trim());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { ...docSnap.data(), id: docSnap.id };
        setSearchResult(data);
      } else {
        setSearchError(`No document found with ID: ${searchQuery.trim()}`);
      }
    } catch (err) {
      setSearchError(`Error searching document: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setSearchError('');
  };

  // Handle Enter key press in search box
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePreview = (record) => {
    setSelectedRecord(record);
    setOpenPreviewModal(true);
  };

  const handleReprint = async (record) => {
    const zpl = generateZPL(record);
    await sendZPLToPrinter(zpl, printerSettings);
    setOpenPreviewModal(false);
  };

  // --- LABEL PREVIEW (matches LabelPrinting style) ---
  const LabelPreview = ({ record }) => (
    <Box
      sx={{
        mt: 2,
        width: '101mm',
        height: '101mm',
        position: 'relative',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <img
        src="/images/BT.jpg"
        alt="Bladetech Logo"
        style={{
          position: 'absolute',
          top: '5mm',
          left: '5mm',
          width: '60mm',
          height: 'auto',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '15mm',
          right: '6mm',
          width: '40mm',
          textAlign: 'right',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black' }}>
          {record.customer}
        </Typography>
        <Typography variant="body1" sx={{ color: 'black' }}>
          PO: {record.PO}
        </Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>
          Invoice: {record.invoice || 'N/A'}
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '45mm',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'black' }}>
          {record.SKU}
        </Typography>
        <Typography variant="h5" sx={{ color: 'black' }}>
          Qty: {record.quantity}
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: '6mm',
          left: '6mm',
        }}
      >
        <Typography variant="body2" sx={{ color: 'black' }}>
          Date: {record.date}
        </Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>
          Operator: {record.operator}
        </Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>
          Laser: {record.laser}
        </Typography>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: '5mm',
          right: '6mm',
        }}
      >
        <QRCodeCanvas value={`QA,${record.id}`} size={90} />
      </Box>
    </Box>
  );

  // Display search result or all records
  const displayRecords = searchResult ? [searchResult] : records;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'black' }}>
        Printed Box Records
      </Typography>

      {/* Search Box */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search by Document ID
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter Document ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            disabled={searchLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon />
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
            sx={{ minWidth: 120 }}
          >
            {searchLoading ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Box>

        {/* Search Error */}
        {searchError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {searchError}
          </Alert>
        )}

        {/* Search Result Info */}
        {searchResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Found document: {searchResult.id} - {searchResult.customer} - {searchResult.SKU} - Invoice: {searchResult.invoice || 'N/A'}
          </Alert>
        )}
      </Paper>

      {/* Records Table */}
      <Paper sx={{ width: '100%', overflow: 'auto', mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>PO</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Laser</TableCell>
              <TableCell>Preview/Reprint</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {searchResult === null && searchQuery ? 'No records found' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : (
              displayRecords.map(record => (
                <TableRow key={record.id} sx={{ backgroundColor: searchResult ? '#f0f8ff' : 'inherit' }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                    {record.id}
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.customer}</TableCell>
                  <TableCell>{record.PO}</TableCell>
                  <TableCell>{record.invoice || 'N/A'}</TableCell>
                  <TableCell>{record.SKU}</TableCell>
                  <TableCell>{record.quantity}</TableCell>
                  <TableCell>{record.operator}</TableCell>
                  <TableCell>{record.laser}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handlePreview(record)}
                    >
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Show all records button when search is active */}
      {searchResult && (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleClearSearch}
            size="large"
          >
            Show All Records
          </Button>
        </Box>
      )}

      <Dialog
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        maxWidth="lg"
      >
        <DialogTitle>Label Preview &amp; Reprint</DialogTitle>
        <DialogContent>
          {selectedRecord && <LabelPreview record={selectedRecord} />}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => handleReprint(selectedRecord)}
          >
            Reprint (Network)
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenPreviewModal(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrintedBoxesRecord;