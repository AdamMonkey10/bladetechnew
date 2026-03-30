// src/components/ReportTable.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '../firebase'; // Ensure this path is correct
import { collection, getDocs } from 'firebase/firestore';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Stack,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import { DataGrid, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function ReportTable() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);

  // State for Snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'error', 'info', 'warning'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Reference to the 'milwaukeeTestReports' collection
        const reportsCollection = collection(db, 'milwaukeeTestReports');
        const querySnapshot = await getDocs(reportsCollection);
        const reportsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // Determine the status
          const status = data.Status === true ? 'Good' : 'Bad';

          // Handle 'date' field
          let dateField = null;
          if (data.date) {
            if (typeof data.date.toDate === 'function') {
              // Firestore Timestamp
              dateField = data.date.toDate();
            } else if (data.date instanceof Date) {
              // Already a Date object
              dateField = data.date;
            } else {
              // Assume string
              dateField = new Date(data.date);
            }
            // Validate the date
            if (isNaN(dateField)) {
              dateField = null;
            }
          }

          return {
            id: doc.id,
            sku: data.sku || 'N/A',
            machine: data.machine || 'N/A',
            Status: status,
            date: dateField, // Date object or null
          };
        }).filter(report => report !== undefined && report !== null); // Ensure no undefined or null reports

        console.log('Fetched Reports Data:', reportsData); // Debugging line

        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Handle View Report Action
  const handleViewReport = (id) => {
    navigate(`/reports/${id}`);
  };

  // Memoize applyFilters using useCallback
  const applyFilters = useCallback(() => {
    let filtered = reports;

    // Apply Status Filter
    if (statusFilter) {
      filtered = filtered.filter((report) => report.Status === statusFilter);
    }

    // Apply Start Date Filter
    if (startDateFilter) {
      // Set the start of the day to ignore time
      const start = new Date(startDateFilter);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        (report) => report.date && report.date >= start
      );
    }

    // Apply End Date Filter
    if (endDateFilter) {
      // Set the end of the day to ignore time
      const end = new Date(endDateFilter);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (report) => report.date && report.date <= end
      );
    }

    return filtered;
  }, [reports, statusFilter, startDateFilter, endDateFilter]);

  // Memoize the filtered reports
  const filteredReports = useMemo(() => applyFilters(), [applyFilters]);

  const handleDownloadAll = () => {
    // Export all reports based on current filters
    if (filteredReports.length === 0) {
      setSnackbar({
        open: true,
        message: 'No reports available to download.',
        severity: 'info',
      });
      return;
    }

    try {
      // Define the headers
      const headers = ['SKU', 'Machine', 'Date', 'Status'];

      // Prepare data for CSV
      const csvData = filteredReports.map((report) => ({
        SKU: report.sku,
        Machine: report.machine,
        Date: report.date ? report.date.toLocaleDateString() : 'N/A',
        Status: report.Status,
      }));

      // Convert data to CSV using PapaParse
      const csv = Papa.unparse({
        fields: headers,
        data: csvData,
      });

      // Create a blob from the CSV content
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'milwaukee_test_reports.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL after download to free up memory
      URL.revokeObjectURL(url);

      // Show success Snackbar
      setSnackbar({
        open: true,
        message: 'Download started!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error during CSV download:', err);
      setSnackbar({
        open: true,
        message: 'Failed to download reports.',
        severity: 'error',
      });
    }
  };

  // Define the data grid columns
  const columns = [
    {
      field: 'sku',
      headerName: 'SKU',
      flex: 1,
      minWidth: 150,
      sortable: true,
    },
    {
      field: 'machine',
      headerName: 'Machine',
      flex: 1,
      minWidth: 150,
      sortable: true,
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 150,
      sortable: true,
      renderCell: (params) => {
        if (!params || !params.row || !params.row.date) return 'N/A';
        const date = new Date(params.row.date);
        return date.toLocaleDateString();
      },
    },
    {
      field: 'Status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      sortable: true,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value === 'Good' ? 'green' : 'red'}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleViewReport(params.id)}
        >
          View Report
        </Button>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="lg"
        sx={{
          mt: 12,
          pl: { xs: 2, sm: 4 },
          pr: { xs: 2, sm: 4 },
        }}
      >
        {/* Header Section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={2}
        >
          <Typography variant="h4" sx={{ mb: { xs: 2, sm: 0 } }}>
            Milwaukee Test Reports
          </Typography>
          <Button variant="contained" color="primary" onClick={handleDownloadAll}>
            Download All Reports
          </Button>
        </Stack>

        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            {/* Status Filter */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Bad">Bad</MenuItem>
              </Select>
            </FormControl>

            {/* Start Date Filter */}
            <DatePicker
              label="Start Date"
              value={startDateFilter}
              onChange={(newValue) => setStartDateFilter(newValue)}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ minWidth: 150 }} />
              )}
            />

            {/* End Date Filter */}
            <DatePicker
              label="End Date"
              value={endDateFilter}
              onChange={(newValue) => setEndDateFilter(newValue)}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ minWidth: 150 }} />
              )}
            />

            {/* Clear Filters Button */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setStatusFilter('');
                setStartDateFilter(null);
                setEndDateFilter(null);
              }}
              sx={{ height: '40px' }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* LoadingIndicator */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {console.log('Filtered Reports:', filteredReports)} {/* Debugging line */}
            <Box sx={{ height: 600, width: '100%', overflowX: 'auto' }}>
              <DataGrid
                rows={filteredReports}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                disableSelectionOnClick
                autoHeight
                components={{
                  Toolbar: GridToolbarQuickFilter,
                }}
                componentsProps={{
                  toolbar: {
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f5f5f5',
                    fontSize: '0.875rem',
                  },
                  '& .MuiDataGrid-cell': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    lineHeight: '1.2 !important',
                    padding: '4px',
                    fontSize: '0.75rem',
                  },
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    backgroundColor: '#fafafa',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f1f1f1',
                  },
                }}
              />
            </Box>
          </>
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
    </LocalizationProvider>
  );
}

export default ReportTable;
