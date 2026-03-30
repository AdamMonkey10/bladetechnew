// src/components/CalibrationDetail.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; // Ensure this path is corrects
import {
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
} from '@mui/material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // For table generation in PDF

function CalibrationDetail() {
  const { id } = useParams();
  const [calibration, setCalibration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCalibration = async () => {
    try {
      const docRef = doc(db, 'Calibrations', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let date;

        if (data.date instanceof Timestamp) {
          date = data.date.toDate().toLocaleDateString();
        } else if (typeof data.date === 'string') {
          const parsedDate = new Date(data.date);
          date = !isNaN(parsedDate) ? parsedDate.toLocaleDateString() : 'Invalid Date';
        } else {
          date = 'Invalid Date';
        }

        setCalibration({
          id: docSnap.id,
          ...data,
          date,
        });
      } else {
        setError('No such calibration found.');
      }
    } catch (err) {
      console.error('Error fetching calibration:', err);
      setError('Failed to load calibration details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalibration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const generatePDF = () => {
    if (!calibration) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Calibration Report', 14, 22);

    // Basic Information
    doc.setFontSize(12);
    doc.text(`Date: ${calibration.date}`, 14, 32);
    doc.text(`Tool Name: ${calibration.toolName}`, 14, 40);
    doc.text(`Serial Number: ${calibration.serial}`, 14, 48);
    doc.text(`Performed By: ${calibration.performedBy}`, 14, 56);

    // Check if results exist
    if (calibration.results && calibration.results.length > 0) {
      doc.setFontSize(14);
      doc.text('Calibration Results:', 14, 68);

      // Prepare table data
      const tableColumn = ['Test', '0', '0.25', '0.5', '0.75', '1', '2', '3', '6'];
      const tableRows = [];

      calibration.results.forEach((result) => {
        const rowData = [
          result.test,
          result.level0 !== null && result.level0 !== undefined ? result.level0 : '-',
          result.level025 !== null && result.level025 !== undefined ? result.level025 : '-',
          result.level05 !== null && result.level05 !== undefined ? result.level05 : '-',
          result.level075 !== null && result.level075 !== undefined ? result.level075 : '-',
          result.level1 !== null && result.level1 !== undefined ? result.level1 : '-',
          result.level2 !== null && result.level2 !== undefined ? result.level2 : '-',
          result.level3 !== null && result.level3 !== undefined ? result.level3 : '-',
          result.level6 !== null && result.level6 !== undefined ? result.level6 : '-',
        ];
        tableRows.push(rowData);
      });

      // Add table
      doc.autoTable({
        startY: 72,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
      });
    } else {
      doc.setFontSize(12);
      doc.text('No calibration results available.', 14, 68);
    }

    // Save the PDF
    doc.save(`Calibration_Report_${calibration.id}.pdf`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 12 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 12 }}>
      <Typography variant="h4" gutterBottom>
        Calibration Details
      </Typography>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell>{calibration.date}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Tool Name</strong></TableCell>
              <TableCell>{calibration.toolName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Serial Number</strong></TableCell>
              <TableCell>{calibration.serial}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Performed By</strong></TableCell>
              <TableCell>{calibration.performedBy}</TableCell>
            </TableRow>
            {/* Add more basic information fields as needed */}
          </TableBody>
        </Table>
      </Paper>

      {calibration.results && calibration.results.length > 0 ? (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Calibration Results
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Test</strong></TableCell>
                <TableCell><strong>0</strong></TableCell>
                <TableCell><strong>0.25</strong></TableCell>
                <TableCell><strong>0.5</strong></TableCell>
                <TableCell><strong>0.75</strong></TableCell>
                <TableCell><strong>1</strong></TableCell>
                <TableCell><strong>2</strong></TableCell>
                <TableCell><strong>3</strong></TableCell>
                <TableCell><strong>6</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calibration.results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.test}</TableCell>
                  <TableCell>{result.level0 !== null && result.level0 !== undefined ? result.level0 : '-'}</TableCell>
                  <TableCell>{result.level025 !== null && result.level025 !== undefined ? result.level025 : '-'}</TableCell>
                  <TableCell>{result.level05 !== null && result.level05 !== undefined ? result.level05 : '-'}</TableCell>
                  <TableCell>{result.level075 !== null && result.level075 !== undefined ? result.level075 : '-'}</TableCell>
                  <TableCell>{result.level1 !== null && result.level1 !== undefined ? result.level1 : '-'}</TableCell>
                  <TableCell>{result.level2 !== null && result.level2 !== undefined ? result.level2 : '-'}</TableCell>
                  <TableCell>{result.level3 !== null && result.level3 !== undefined ? result.level3 : '-'}</TableCell>
                  <TableCell>{result.level6 !== null && result.level6 !== undefined ? result.level6 : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="body1">
            No calibration results available.
          </Typography>
        </Paper>
      )}

      {/* Button to Generate PDF */}
      <Button variant="contained" color="primary" onClick={generatePDF}>
        Download PDF
      </Button>
    </Container>
  );
}

export default CalibrationDetail;
