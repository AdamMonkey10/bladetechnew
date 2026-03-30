// src/components/CalibrationReportTable.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Stack,
  Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { filter as lodashFilter } from 'lodash'; // Ensure lodash is installed

function CalibrationReportTable() {
  const [calibrations, setCalibrations] = useState([]);
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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalibrations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Calibrations'));
        const calibrationsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          let date;

          if (data.date instanceof Timestamp) {
            // Convert Firestore Timestamp to JavaScript Date
            date = data.date.toDate().toLocaleDateString();
          } else if (typeof data.date === 'string') {
            // Parse date string
            const parsedDate = new Date(data.date);
            if (!isNaN(parsedDate)) {
              date = parsedDate.toLocaleDateString();
            } else {
              date = 'Invalid Date';
            }
          } else {
            date = 'Invalid Date';
          }

          return {
            id: doc.id,
            ...data,
            date,
            resultsPresent: data.results && data.results.length > 0 ? 'Yes' : 'No',
          };
        });
        setCalibrations(calibrationsData);
      } catch (error) {
        console.error('Error fetching calibrations:', error);
        setError('Failed to load calibrations.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalibrations();
  }, []);

  const handleViewCalibration = (id) => {
    navigate(`/calibrations/${id}`);
  };

  // Memoize applyFilters with useCallback
  const applyFilters = useCallback(() => {
    if (!filterModel.items.length) {
      return calibrations;
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
    }, calibrations);
  }, [calibrations, filterModel]);

  // Memoize filteredCalibrations to optimize performance
  const filteredCalibrations = useMemo(() => applyFilters(), [applyFilters]);

  const handleDownloadAll = () => {
    if (filteredCalibrations.length === 0) {
      alert('No calibrations available to download.');
      return;
    }

    // Define the headers
    const headers = [
      'Date',
      'Tool Name',
      'Serial Number',
      'Performed By',
      'Results Present',
      // Add more headers if needed
    ];

    // Map calibrations data to CSV rows
    const rows = filteredCalibrations.map((calibration) => [
      calibration.date,
      calibration.toolName,
      calibration.serial,
      calibration.performedBy,
      calibration.resultsPresent,
      // Add more fields if needed
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
    link.setAttribute('download', 'calibrations.csv');
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

  const columns = [
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'toolName', headerName: 'Tool Name', width: 200 },
    { field: 'serial', headerName: 'Serial Number', width: 150 },
    { field: 'performedBy', headerName: 'Performed By', width: 180 },
    { field: 'resultsPresent', headerName: 'Results', width: 100 },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary" // Blue colors
          size="small"
          onClick={() => handleViewCalibration(params.id)}
        >
          View
        </Button>
      ),
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
        <Typography variant="h4">Calibration Reports</Typography>
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
            rows={filteredCalibrations}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            filterModel={filterModel}
            onFilterModelChange={(model) => setFilterModel(model)}
            components={{
              NoRowsOverlay: () => (
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                  No calibrations found.
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

export default CalibrationReportTable;
