// src/components/CustomerPOList.js

import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CustomerPOList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // For "Complete PO" dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [poToComplete, setPoToComplete] = useState(null);

  // Switch to show only active POs (status === false)
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1) Fetch CustomerPurchaseOrders
        const poSnap = await getDocs(collection(db, 'CustomerPurchaseOrders'));
        const poData = poSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // 2) Fetch LabelBoxes
        const labelSnap = await getDocs(collection(db, 'LabelBoxes'));
        const labelData = labelSnap.docs.map((docSnap) => docSnap.data());

        // Build maps for boxesPrinted & bladesProduced
        const boxesCountMap = {};
        const bladesMap = {};

        labelData.forEach((labelDoc) => {
          const po = labelDoc.PO;
          if (!po) return;
          
          // 1) Count doc => boxesPrinted
          boxesCountMap[po] = (boxesCountMap[po] || 0) + 1;

          // 2) Sum quantity (parse if it's a string)
          const qty =
            typeof labelDoc.quantity === 'string'
              ? parseInt(labelDoc.quantity, 10) || 0
              : labelDoc.quantity || 0;
          bladesMap[po] = (bladesMap[po] || 0) + qty;
        });

        // Merge into PO data
        const merged = poData.map((poRow) => {
          const poNumber = poRow.po;
          const boxesPrinted = boxesCountMap[poNumber] || 0;
          const bladesProduced = bladesMap[poNumber] || 0;
          return {
            ...poRow,
            boxesPrinted,
            bladesProduced,
          };
        });

        setPurchaseOrders(merged);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load purchase orders or label boxes data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter if "showActiveOnly" => only rows where status === false
  const displayedRows = useMemo(() => {
    if (!showActiveOnly) return purchaseOrders;
    return purchaseOrders.filter((row) => row.status === false);
  }, [purchaseOrders, showActiveOnly]);

  // "Complete" button => if row.status === false, we set status = true
  const handleCompleteClick = (row) => {
    if (row.status === false) {
      setPoToComplete(row);
      setConfirmOpen(true);
    }
  };

  const handleConfirmComplete = async () => {
    if (!poToComplete) return;
    try {
      const docRef = doc(db, 'CustomerPurchaseOrders', poToComplete.id);
      await updateDoc(docRef, { status: true }); // mark as Complete
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poToComplete.id ? { ...p, status: true } : p))
      );
    } catch (err) {
      console.error('Error updating PO status:', err);
    } finally {
      setConfirmOpen(false);
      setPoToComplete(null);
    }
  };

  // Use flexible columns
  const columns = [
    { field: 'po', headerName: 'PO #', flex: 1 },
    { field: 'customer', headerName: 'Customer', flex: 1.5 },
    { field: 'sku', headerName: 'SKU', flex: 1 },
    {
      field: 'quantity',
      headerName: 'Total Needed',
      flex: 1,
      // If stored as a string, parse to number for display
      renderCell: (params) => {
        const val = params.value || 0;
        return Number(val); // "0900" => 900
      },
    },
    {
      field: 'boxesPrinted',
      headerName: 'Boxes Printed',
      flex: 1,
    },
    {
      field: 'bladesProduced',
      headerName: 'Total Blades',
      flex: 1,
    },
    {
      field: 'progress',
      headerName: 'Progress',
      flex: 1.5,
      renderCell: (params) => {
        const row = params.row;
        const totalNeeded = Number(row.quantity) || 0;
        const bladesDone = Number(row.bladesProduced) || 0;
        const percent =
          totalNeeded > 0 ? Math.min((bladesDone / totalNeeded) * 100, 100) : 0;

        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress variant="determinate" value={percent} />
            <Typography variant="caption">
              {bladesDone}/{totalNeeded} ({percent.toFixed(0)}%)
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      renderCell: (params) =>
        params.value === false ? 'Active' : 'Complete',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleCompleteClick(row)}
            disabled={row.status !== false}
          >
            Complete
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Customer Purchase Orders
        </Typography>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    // Make the container use the full width of the viewport
    <Container maxWidth={false} sx={{ mt: 4, width: '100%', maxWidth: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Customer Purchase Orders
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
          />
        }
        label="Show only active"
      />

      {displayedRows.length === 0 ? (
        <Alert severity="info">No Purchase Orders found.</Alert>
      ) : (
        // Put the DataGrid in a container that is 80% of the viewport height
        <div style={{ width: '100%', height: '80vh' }}>
          <DataGrid
            rows={displayedRows}
            columns={columns}
            // Let columns expand or shrink to fill the container
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </div>
      )}

      {/* Confirm "Complete" Modal */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Completion</DialogTitle>
        <DialogContent>
          Are you sure you want to mark PO{' '}
          <strong>{poToComplete?.po}</strong> as completed?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmComplete}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerPOList;
