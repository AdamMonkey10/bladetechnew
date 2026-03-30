// src/components/ReportDetails.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MilwaukeeTestReportPDF from './MilwaukeeTestReportPDF'; // Ensure the file exists

function ReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to determine color based on spec
  const getColor = (value, specRange) => {
    if (value === undefined || value === null) return 'textPrimary';

    const { min, max } = specRange;
    if (value >= min && value <= max) {
      return '#4eb857'; // Green
    } else {
      return '#d32f2f'; // Red
    }
  };

  useEffect(() => {
    const fetchReportAndSpec = async () => {
      try {
        // Fetch Report
        const reportDocRef = doc(db, 'milwaukeeTestReports', id);
        const reportSnap = await getDoc(reportDocRef);
        if (reportSnap.exists()) {
          const reportData = reportSnap.data();
          setReport(reportData);

          // Fetch Product Specification based on SKU
          if (reportData.sku) {
            const specDocRef = doc(db, 'products', reportData.sku, 'revisions', reportData.revision);
            const specSnap = await getDoc(specDocRef);
            if (specSnap.exists()) {
              setSpec(specSnap.data().specifications);
            } else {
              console.warn('Specification not found for SKU:', reportData.sku, 'and Revision:', reportData.revision);
            }
          }
        } else {
          setError('Report not found.');
        }
      } catch (error) {
        setError('Failed to load report.');
        console.error('Error fetching report or spec:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportAndSpec();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h6">No report data available.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      {/* Download PDF Button */}
      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <PDFDownloadLink
          document={<MilwaukeeTestReportPDF report={report} />}
          fileName={`Milwaukee_Test_Report_${id}.pdf`}
          style={{
            textDecoration: 'none',
          }}
        >
          {({ loading: pdfLoading }) => (
            <Box
              sx={{
                padding: '13px 20px',
                color: '#ffffff',
                backgroundColor: '#4eb857',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: '#3da34a',
                },
                '&:disabled': {
                  backgroundColor: '#cccccc',
                  cursor: 'not-allowed',
                },
              }}
            >
              <PrintIcon />
              {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
            </Box>
          )}
        </PDFDownloadLink>
      </Box>

      {/* Bladetech Logo */}
      <Box sx={{ textAlign: 'left', mb: 4 }}>
        <img
          src="/images/logo.svg" // Ensure the path is correct and the image exists
          alt="Bladetech Logo"
          style={{ maxWidth: '200px', height: 'auto' }}
        />
      </Box>

      {/* Report Content */}
      <Card elevation={3}>
        <CardContent>
          {/* Report Title */}
          <Typography variant="h4" gutterBottom align="left">
            Milwaukee Test Report
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Basic Information */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              {/* Date */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Date:
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    {report.date && report.date.toDate
                      ? report.date.toDate().toLocaleDateString()
                      : report.date || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Product */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Product (SKU):
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    {report.sku || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Invoice */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Invoice:
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    {report.invoice || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Machine */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Machine:
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    {report.machine || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Sample Count */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Sample Count:
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    {report.sampleCount || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Measurements */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Measurements
            </Typography>
            <Grid container spacing={2}>
              {/* Height */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Height:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.height
                          ? getColor(report.height, spec.height)
                          : 'textPrimary',
                    }}
                  >
                    {report.height || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Blade Width */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Blade Width:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.bladeWidth
                          ? getColor(report.bladeWidth, spec.bladeWidth)
                          : 'textPrimary',
                    }}
                  >
                    {report.bladeWidth || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Blade Body  */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Blade Body:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.bladeBody
                          ? getColor(report.bladeBody, spec.bladeBody)
                          : 'textPrimary',
                    }}
                  >
                    {report.bladeBody || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Blade Bottom */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Blade Bottom:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.bladeBottom
                          ? getColor(report.bladeBottom, spec.bladeBottom)
                          : 'textPrimary',
                    }}
                  >
                    {report.bladeBottom || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Left Tooth Set */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Left Tooth Set:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.toothSet
                          ? getColor(report.toothSetLeft, spec.toothSet)
                          : 'textPrimary',
                    }}
                  >
                    {report.toothSetLeft || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Right Tooth Set */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Right Tooth Set:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.toothSet
                          ? getColor(report.toothSetRight, spec.toothSet)
                          : 'textPrimary',
                    }}
                  >
                    {report.toothSetRight || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Gauge */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Gauge:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.gauge
                          ? getColor(report.gauge, spec.gauge)
                          : 'textPrimary',
                    }}
                  >
                    {report.gauge || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Dross */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Dross:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.dross
                          ? getColor(report.dross, spec.dross)
                          : 'textPrimary',
                    }}
                  >
                    {report.dross || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Flatness */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Flatness:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        spec && spec.flatness
                          ? getColor(report.flatness, spec.flatness)
                          : 'textPrimary',
                    }}
                  >
                    {report.flatness || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ReportDetails;
