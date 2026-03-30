// src/components/PalletManagement.js
// New component - does NOT modify existing LabelPrinting.js

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Container,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  QrCodeScanner as ScanIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  createPallet,
  getPallets,
  getAvailableBoxes,
  addBoxToPallet,
  removeBoxFromPallet,
  completePallet,
  getPalletWithBoxes,
  getPalletSettings,
} from '../utils/palletUtils';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

// --- Pallet Card Component ---
const PalletCard = ({ pallet, onViewDetails, onComplete, onPrint }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'shipped': return 'default';
      default: return 'default';
    }
  };

  const progressPercentage = (pallet.currentCount / pallet.maxCapacity) * 100;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {pallet.palletNumber}
          </Typography>
          <Chip 
            label={pallet.status.toUpperCase()} 
            color={getStatusColor(pallet.status)} 
            size="small" 
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Customer</Typography>
            <Typography variant="body1">{pallet.customer || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">PO</Typography>
            <Typography variant="body1">{pallet.PO || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">SKU</Typography>
            <Typography variant="body1">{pallet.SKU || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Total Quantity</Typography>
            <Typography variant="body1">{pallet.totalQuantity || 0}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Boxes: {pallet.currentCount} / {pallet.maxCapacity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Created: {pallet.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
          {pallet.createdBy && ` by ${pallet.createdBy}`}
        </Typography>
      </CardContent>

      <CardActions>
        <Button size="small" onClick={() => onViewDetails(pallet)}>
          View Details
        </Button>
        {pallet.status === 'active' && (
          <Button 
            size="small" 
            color="success" 
            onClick={() => onComplete(pallet)}
            disabled={pallet.currentCount === 0}
          >
            Complete
          </Button>
        )}
        {pallet.status === 'completed' && (
          <Button size="small" color="primary" onClick={() => onPrint(pallet)}>
            Print Label
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// --- New Pallet Dialog ---
const NewPalletDialog = ({ open, onClose, onCreate }) => {
  const [customerPOs, setCustomerPOs] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerPO: '',
    operator: '',
    maxCapacity: 48,
    customer: '',
    PO: '',
    SKU: '',
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Fetch customer POs (reusing existing collection)
      const customerPOCollection = collection(db, 'CustomerPurchaseOrders');
      const poSnapshot = await getDocs(customerPOCollection);
      const poList = poSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomerPOs(poList);

      // Fetch operators (reusing existing collection)
      const operatorsCollection = collection(db, 'Operators');
      const opSnapshot = await getDocs(operatorsCollection);
      const opList = opSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().Name,
        initials: doc.data().initials,
      }));
      setOperators(opList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCustomerPOChange = (e) => {
    const selectedId = e.target.value;
    setFormData(prev => ({ ...prev, customerPO: selectedId }));

    const selectedPO = customerPOs.find(po => po.id === selectedId);
    if (selectedPO) {
      setFormData(prev => ({
        ...prev,
        customer: selectedPO.customer,
        PO: selectedPO.po,
        SKU: selectedPO.sku,
      }));
    }
  };

  const handleCreate = async () => {
    if (!formData.operator) {
      alert('Please select an operator');
      return;
    }

    setLoading(true);
    try {
      await createPallet({
        customer: formData.customer,
        PO: formData.PO,
        SKU: formData.SKU,
        maxCapacity: formData.maxCapacity,
        operator: formData.operator,
      });
      onCreate();
      onClose();
      setFormData({
        customerPO: '',
        operator: '',
        maxCapacity: 48,
        customer: '',
        PO: '',
        SKU: '',
      });
    } catch (error) {
      console.error('Error creating pallet:', error);
      alert('Error creating pallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Pallet</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Customer PO</InputLabel>
            <Select
              value={formData.customerPO}
              label="Customer PO"
              onChange={handleCustomerPOChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {customerPOs.map(po => (
                <MenuItem key={po.id} value={po.id}>
                  {po.po} - {po.customer}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer"
                value={formData.customer}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="PO"
                value={formData.PO}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="SKU"
                value={formData.SKU}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={formData.operator}
                  label="Operator"
                  onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {operators.map(op => (
                    <MenuItem key={op.id} value={op.initials}>
                      {op.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Capacity"
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 48 }))}
                fullWidth
                inputProps={{ min: 1, max: 200 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Pallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Main Pallet Management Component ---
const PalletManagement = () => {
  const [pallets, setPallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [newPalletOpen, setNewPalletOpen] = useState(false);
  const [selectedPallet, setSelectedPallet] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchPallets();
  }, []);

  const fetchPallets = async () => {
    setLoading(true);
    setError('');
    try {
      const palletsData = await getPallets();
      setPallets(palletsData);
    } catch (err) {
      setError('Failed to load pallets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePallet = () => {
    fetchPallets();
  };

  const handleViewDetails = async (pallet) => {
    try {
      const palletWithBoxes = await getPalletWithBoxes(pallet.id);
      setSelectedPallet(palletWithBoxes);
      setDetailsOpen(true);
    } catch (err) {
      alert('Error loading pallet details: ' + err.message);
    }
  };

  const handleCompletePallet = async (pallet) => {
    if (window.confirm(`Complete pallet ${pallet.palletNumber}?`)) {
      try {
        await completePallet(pallet.id);
        fetchPallets();
      } catch (err) {
        alert('Error completing pallet: ' + err.message);
      }
    }
  };

  const handlePrintLabel = (pallet) => {
    // TODO: Implement pallet label printing
    alert('Pallet label printing will be implemented next');
  };

  const filterPalletsByStatus = (status) => {
    if (status === 'all') return pallets;
    return pallets.filter(pallet => pallet.status === status);
  };

  const getTabLabel = (status) => {
    const count = status === 'all' ? pallets.length : pallets.filter(p => p.status === status).length;
    return `${status.charAt(0).toUpperCase() + status.slice(1)} (${count})`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading pallets...</Typography>
      </Container>
    );
  }

  const tabStatuses = ['all', 'active', 'completed', 'shipped'];
  const currentStatus = tabStatuses[tabValue];
  const filteredPallets = filterPalletsByStatus(currentStatus);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'black' }}>
          Pallet Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewPalletOpen(true)}
        >
          New Pallet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabStatuses.map((status, index) => (
            <Tab key={status} label={getTabLabel(status)} />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {filteredPallets.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No {currentStatus === 'all' ? '' : currentStatus} pallets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {currentStatus === 'active' && 'Create a new pallet to get started'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredPallets.map(pallet => (
            <Grid item xs={12} sm={6} md={4} key={pallet.id}>
              <PalletCard
                pallet={pallet}
                onViewDetails={handleViewDetails}
                onComplete={handleCompletePallet}
                onPrint={handlePrintLabel}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* New Pallet Dialog */}
      <NewPalletDialog
        open={newPalletOpen}
        onClose={() => setNewPalletOpen(false)}
        onCreate={handleCreatePallet}
      />

      {/* Pallet Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Pallet Details: {selectedPallet?.palletNumber}
        </DialogTitle>
        <DialogContent>
          {selectedPallet && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">{selectedPallet.customer}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">PO</Typography>
                  <Typography variant="body1">{selectedPallet.PO}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">SKU</Typography>
                  <Typography variant="body1">{selectedPallet.SKU}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedPallet.status.toUpperCase()} 
                    color={selectedPallet.status === 'active' ? 'primary' : 'success'} 
                    size="small" 
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Assigned Boxes ({selectedPallet.assignedBoxes?.length || 0})
              </Typography>

              {selectedPallet.assignedBoxes?.length > 0 ? (
                <Grid container spacing={1}>
                  {selectedPallet.assignedBoxes.map(box => (
                    <Grid item xs={12} sm={6} md={4} key={box.id}>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Box: {box.id.slice(-6)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty: {box.quantity} | {box.laser} | {box.operator}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {box.date}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  No boxes assigned to this pallet yet.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PalletManagement;