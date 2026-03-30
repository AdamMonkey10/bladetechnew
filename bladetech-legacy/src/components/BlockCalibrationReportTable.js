// src/components/BlockCalibrationReportTable.js

import React, { useEffect, useState, useMemo } from 'react';
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
import { filter as lodashFilter } from 'lodash'; // Ensure lodash is installed

function BlockCalibrationReportTable() {
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

  // Removed the unused 'navigate' variable
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchCalibrations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'block-calibration'));
        const calibrationsData = querySnapshot.docs
          .map((doc) => {
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
            };
          })
          .filter((calibration) => calibration && calibration.id); // Filter out any undefined or invalid entries
        setCalibrations(calibrationsData);
        console.log('Calibrations data:', calibrationsData);
      } catch (error) {
        console.error('Error fetching block calibrations:', error);
        setError('Failed to load block calibrations.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalibrations();
  }, []);

  // Function to apply filters based on filterModel
  // Removed 'applyFilters' as a separate function and moved its logic inside useMemo
  // const applyFilters = () => {
  //   if (!filterModel.items.length) {
  //     return calibrations;
  //   }

  //   // Iterate over each filter item and apply them sequentially
  //   return filterModel.items.reduce((filtered, filterItem) => {
  //     const { columnField, operatorValue, value } = filterItem;

  //     // Handle different operators based on the column's data type
  //     switch (operatorValue) {
  //       case 'contains':
  //         return lodashFilter(filtered, (row) =>
  //           row[columnField]
  //             ? row[columnField].toString().toLowerCase().includes(value.toLowerCase())
  //             : false
  //         );
  //       case 'equals':
  //         return lodashFilter(filtered, (row) => row[columnField] === value);
  //       case 'startsWith':
  //         return lodashFilter(filtered, (row) =>
  //           row[columnField]
  //             ? row[columnField].toString().toLowerCase().startsWith(value.toLowerCase())
  //             : false
  //         );
  //       case 'endsWith':
  //         return lodashFilter(filtered, (row) =>
  //           row[columnField]
  //             ? row[columnField].toString().toLowerCase().endsWith(value.toLowerCase())
  //             : false
  //         );
  //       // Add more cases as needed for different operators
  //       default:
  //         return filtered;
  //     }
  //   }, calibrations);
  // };

  // Memoize filteredCalibrations to optimize performance
  const filteredCalibrations = useMemo(() => {
    if (!filterModel.items.length) {
      return calibrations;
    }

    // Iterate over each filter item and apply them sequentially
    return filterModel.items.reduce((filtered, filterItem) => {
      const { columnField, operatorValue, value } = filterItem;

      // Handle different operators based on the column's data type
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

  // Log the filtered data for debugging
  console.log('Filtered Calibrations:', filteredCalibrations);

  const handleDownloadAll = () => {
    if (filteredCalibrations.length === 0) {
      alert('No calibrations available to download.');
      return;
    }

    // Define the headers
    const headers = [
      'Date',
      'Block Name',
      'Performed By',
      'Tool 1',
      'Tool 2',
      // Add more headers if needed
    ];

    // Map calibrations data to CSV rows
    const rows = filteredCalibrations.map((calibration) => [
      calibration.date,
      calibration.blockName,
      calibration.performedBy,
      calibration.tools?.tool1 || '',
      calibration.tools?.tool2 || '',
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
    link.setAttribute('download', 'block_calibrations.csv');
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

  // Updated columns array without the "action" column
  const columns = [
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'blockName', headerName: 'Block Name', width: 200 },
    { field: 'performedBy', headerName: 'Performed By', width: 180 },
    {
      field: 'tool1',
      headerName: 'Tool 1',
      width: 150,
      valueGetter: (params) => {
        console.log('ValueGetter params for tool1:', params);
        return params?.row?.tools?.tool1 || '';
      },
    },
    {
      field: 'tool2',
      headerName: 'Tool 2',
      width: 150,
      valueGetter: (params) => {
        console.log('ValueGetter params for tool2:', params);
        return params?.row?.tools?.tool2 || '';
      },
    },
    // The "action" column has been removed
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 12 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Block Calibration Reports</Typography>
        <Button
          variant="contained"
          color="primary"
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
                  No block calibrations found.
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

export default BlockCalibrationReportTable;
