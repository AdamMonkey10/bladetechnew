// src/components/PdfCatalog.js
import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; // Ensure 'storage' is imported
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Stack,
  Snackbar,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';

const PdfCatalog = () => {
  // State for PDFs data
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for file upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // State for snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // can be 'error', 'info', 'warning'
  });

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const pdfCollection = collection(db, 'Pdfs'); // Ensure 'Pdfs' is the correct collection name
        const pdfSnapshot = await getDocs(pdfCollection);
        const pdfList = pdfSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPdfs(pdfList);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
        setError('Failed to fetch PDFs.');
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setSnackbar({
          open: true,
          message: 'Only PDF files are allowed.',
          severity: 'warning',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: 'Please select a PDF file to upload.',
        severity: 'warning',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storagePath = `pdfs/${selectedFile.name}-${Date.now()}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setSnackbar({
            open: true,
            message: 'Failed to upload the PDF.',
            severity: 'error',
          });
          setUploading(false);
        },
        async () => {
          // Upload completed successfully, now get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Add PDF metadata to Firestore
          const pdfCollection = collection(db, 'Pdfs');
          await addDoc(pdfCollection, {
            name: selectedFile.name,
            url: downloadURL,
            createdAt: new Date(),
            storagePath: storagePath, // Store storage path for deletion
          });

          // Refresh the PDF list
          const pdfSnapshot = await getDocs(pdfCollection);
          const pdfList = pdfSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPdfs(pdfList);

          // Show success message
          setSnackbar({
            open: true,
            message: 'PDF uploaded successfully!',
            severity: 'success',
          });

          // Reset selected file
          setSelectedFile(null);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setSnackbar({
        open: true,
        message: 'Failed to upload the PDF.',
        severity: 'error',
      });
      setUploading(false);
    }
  };

  // Handle PDF deletion
  const handleDelete = async (id, storagePath) => {
    try {
      // Delete the PDF document from Firestore
      const pdfDoc = doc(db, 'Pdfs', id);
      await deleteDoc(pdfDoc);

      // Delete the file from Firebase Storage
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);

      // Refresh the PDF list
      const pdfCollection = collection(db, 'Pdfs');
      const pdfSnapshot = await getDocs(pdfCollection);
      const pdfList = pdfSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPdfs(pdfList);

      // Show success message
      setSnackbar({
        open: true,
        message: 'PDF deleted successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error("Error deleting PDF:", error);
      setSnackbar({
        open: true,
        message: 'Failed to delete the PDF.',
        severity: 'error',
      });
    }
  };

  // Columns configuration for the DataGrid
  const columns = [
    { field: 'name', headerName: 'PDF Name', width: 300 },
    {
      field: 'url',
      headerName: 'PDF URL',
      width: 300,
      renderCell: (params) => (
        <a href={params.value} target="_blank" rel="noopener noreferrer">
          View PDF
        </a>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => handleDelete(params.row.id, params.row.storagePath)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Snackbar for notiications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">Document Storage</Typography>
      </Stack>

      {/* Upload Section */}
      <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload PDF
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              {selectedFile ? selectedFile.name : 'Select PDF'}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              fullWidth
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Grid>
          {uploading && (
            <Grid item xs={12}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // DataGrid for displaying PDFs
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={pdfs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
          />
        </div>
      )}
    </Container>
  );
};

export default PdfCatalog;
