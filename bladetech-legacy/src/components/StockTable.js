// src/components/StockTable.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '../firebase'; // Ensure this points to your Firebase configuration
import {
  collection,
  getDocs,
  doc,
  addDoc,
  runTransaction,
} from 'firebase/firestore';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Stack,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { filter as lodashFilter } from 'lodash'; // Ensure lodash is installed

function StockTable() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for filter model
  const [filterModel, setFilterModel] = useState({
    items: [],
  });

  // State for Snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'error', 'info', 'warning'
  });

  // Removed unused navigate
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Goodsin'));
        const stocksData = querySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            invoice: data.invoice || 'N/A',
            palletNumber: data.palletNumber || 'N/A',
            sku: data.sku || 'N/A', // Include SKU field
            completed: data.completed ? 'Yes' : 'No',
            // Include other fields if necessary
          };
        });
        setStocks(stocksData);
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setError('Failed to load stock data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  /**
   * Memoize applyFilters with useCallback
   */
  const applyFilters = useCallback(() => {
    if (!filterModel.items.length) {
      return stocks;
    }

    return filterModel.items.reduce((filtered, filterItem) => {
      const { columnField, operatorValue, value } = filterItem;

      switch (operatorValue) {
        case 'contains':
          return lodashFilter(filtered, (row) =>
            row[columnField]
              ? row[columnField].toString().toLowerCase().includes(value.toLowerCase())
              : false
          );
        case 'equals':
          return lodashFilter(filtered, (row) => row[columnField] === value);
        case 'startsWith':
          return lodashFilter(filtered, (row) =>
            row[columnField]
              ? row[columnField].toString().toLowerCase().startsWith(value.toLowerCase())
              : false
          );
        case 'endsWith':
          return lodashFilter(filtered, (row) =>
            row[columnField]
              ? row[columnField].toString().toLowerCase().endsWith(value.toLowerCase())
              : false
          );
        // Add more cases as needed for different operators
        default:
          return filtered;
      }
    }, stocks);
  }, [stocks, filterModel]);

  // Memoize filteredStocks to optimize performance
  const filteredStocks = useMemo(() => applyFilters(), [applyFilters]);

  const handleDownloadAll = () => {
    if (filteredStocks.length === 0) {
      alert('No stock entries available to download.');
      return;
    }

    // Define the headers, including SKU
    const headers = ['Invoice', 'Pallet Number', 'SKU', 'Completed'];

    // Map stock data to CSV rows, including SKU
    const rows = filteredStocks.map((stock) => [
      stock.invoice,
      stock.palletNumber,
      stock.sku, // Include SKU in rows
      stock.completed,
    ]);

    // Combine headers and rows
    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((item) => {
              // Escape double quotes by replacing " with ""
              const escapedItem =
                typeof item === 'string' ? item.replace(/"/g, '""') : item;
              // If the item contains a comma, newline, or double quote, wrap it in double quotes
              if (
                typeof escapedItem === 'string' &&
                (escapedItem.includes(',') ||
                  escapedItem.includes('\n') ||
                  escapedItem.includes('"'))
              ) {
                return `"${escapedItem}"`;
              }
              return escapedItem;
            })
            .join(',')
        )
        .join('\n');

    // Create a blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stocks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success Snackbar
    setSnackbar({
      open: true,
      message: 'Download started!',
      severity: 'success',
    });
  };

  /**
   * Handles marking a stock entry as completed.
   * This involves:
   * 1. Copying the document to 'FinishedStock' collection.
   * 2. Deleting the original document from 'Goodsin' collection.
   * Both operations are performed within a Firestore transaction to ensure atomicity.
   *
   * @param {string} id - The Firestore document ID of the stock entry.
   */
  const handleMarkCompleted = async (id) => {
    const stockDocRef = doc(db, 'Goodsin', id);
    const finishedStockCollectionRef = collection(db, 'FinishedStock');

    try {
      await runTransaction(db, async (transaction) => {
        const stockDoc = await transaction.get(stockDocRef);
        if (!stockDoc.exists()) {
          throw new Error('Stock entry does not exist.');
        }

        const stockData = stockDoc.data();

        // Add to 'FinishedStock' collection, including SKU
        const finishedStockData = {
          ...stockData,
          completedAt: new Date(), // Optional: Add a timestamp
        };
        await addDoc(finishedStockCollectionRef, finishedStockData);

        // Delete from 'Goodsin' collection
        transaction.delete(stockDocRef);
      });

      // Update local state by removing the deleted stock entry
      setStocks((prevStocks) => prevStocks.filter((stock) => stock.id !== id));

      // Show success Snackbar
      setSnackbar({
        open: true,
        message: 'Stock entry marked as completed!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark as completed.',
        severity: 'error',
      });
    }
  };

  const columns = [
    { field: 'invoice', headerName: 'Invoice', width: 200 },
    { field: 'palletNumber', headerName: 'Pallet Number', width: 150 },
    { field: 'sku', headerName: 'SKU', width: 200 }, // New SKU column
    { field: 'completed', headerName: 'Completed', width: 130 },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isCompleted = params.row.completed === 'Yes';
        return (
          <Tooltip title={isCompleted ? 'Already Completed' : 'Mark as Completed'}>
            <span>
              <Button
                variant="contained"
                color="success" // Green color
                size="small"
                onClick={() => handleMarkCompleted(params.id)}
                disabled={isCompleted}
              >
                {isCompleted ? 'Completed' : 'Mark Completed'}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 12 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Stock Reports</Typography>
        <Button
          variant="contained"
          color="primary" // Blue color
          onClick={handleDownloadAll}
        >
          Download All
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredStocks}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            filterModel={filterModel}
            onFilterModelChange={(model) => setFilterModel(model)}
            components={{
              NoRowsOverlay: () => (
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                  No stock entries found.
                </Typography>
              ),
            }}
          />
        </div>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}

export default StockTable;
