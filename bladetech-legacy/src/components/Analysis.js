// src/components/Analysis.js

import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { mean, std, median, variance } from 'mathjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Register necessary Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Define the Transition for the Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// List of specifications
const specificationsList = [
  { name: 'height', label: 'Height', type: 'number' },
  { name: 'bladeWidth', label: 'Blade Width', type: 'number' },
  { name: 'bladeBody', label: 'Blade Body', type: 'number' },
  { name: 'bladeBottom', label: 'Blade Bottom', type: 'number' },
  { name: 'toothSetLeft', label: 'Tooth Set Left', type: 'number' },
  { name: 'toothSetRight', label: 'Tooth Set Right', type: 'number' },
  { name: 'gauge', label: 'Gauge', type: 'number' },
  { name: 'dross', label: 'Dross', type: 'text' },
];

function Analysis() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Determine if the screen is mobile

  // Define a color palette for the charts and PDF
  const colorPalette = [
    'rgba(255, 99, 132, 0.6)',   // Red
    'rgba(54, 162, 235, 0.6)',   // Blue
    'rgba(255, 206, 86, 0.6)',   // Yellow
    'rgba(75, 192, 192, 0.6)',   // Green
    'rgba(153, 102, 255, 0.6)',  // Purple
    'rgba(255, 159, 64, 0.6)',   // Orange
    'rgba(199, 199, 199, 0.6)',  // Grey
    'rgba(83, 102, 255, 0.6)',   // Indigo
    'rgba(255, 102, 255, 0.6)',  // Pink
    'rgba(102, 255, 102, 0.6)',  // Light Green
  ];

  // Initialize Formik for form handling
  const formik = useFormik({
    initialValues: {
      sku: null, // SKU selection
      revisions: [], // Revisions selection
      startDate: '',
      endDate: '',
      selectedSpecifications: [],
      selectedMachine: '',
    },
    validationSchema: Yup.object({
      sku: Yup.object()
        .nullable()
        .required('SKU is required'),
      revisions: Yup.array()
        .min(1, 'At least one revision must be selected')
        .required('Revisions are required'),
      startDate: Yup.date()
        .nullable()
        .max(Yup.ref('endDate'), 'Start date cannot be after end date'),
      endDate: Yup.date()
        .nullable()
        .min(Yup.ref('startDate'), 'End date cannot be before start date'),
      selectedSpecifications: Yup.array().of(Yup.string()),
      selectedMachine: Yup.string().matches(
        /^[A-Za-z0-9\s-]+$/,
        'Machine identifier can include letters, numbers, spaces, and hyphens.'
      ),
    }),
    onSubmit: async (values) => {
      if (!values.sku) {
        setError('Please select a valid SKU.');
        return;
      }

      setLoading(true);
      setError('');
      setCpData(null);
      setCpkData(null);
      setHistogramData({});
      setSummaryStats({});
      setRawReports([]); // Clear previous raw reports

      const { sku, revisions, startDate, endDate, selectedSpecifications, selectedMachine } = values;

      try {
        // Fetch product specifications based on SKU ID
        const productRef = doc(db, 'products', sku.id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          setError('Product with the selected SKU does not exist.');
          setLoading(false);
          return;
        }

        const specifications = productSnap.data().specifications;

        // Build the Firestore query
        let qQuery = query(collection(db, 'milwaukeeTestReports'), where('sku', '==', sku.id));

        // Apply revisions filter (excluding "All Revisions")
        if (!revisions.some(rev => rev.id === 'ALL')) {
          // Firestore 'in' queries can have up to 10 elements
          if (revisions.length > 10) {
            setError('Cannot select more than 10 revisions due to Firestore limitations.');
            setLoading(false);
            return;
          }
          qQuery = query(qQuery, where('revision', 'in', revisions.map(rev => rev.id)));
        }

        // Apply machine filter if selected
        if (selectedMachine && selectedMachine.trim() !== '') {
          const sanitizedMachine = selectedMachine.trim().toUpperCase();
          qQuery = query(qQuery, where('machine', '==', sanitizedMachine));
        }

        // Get reports from Firestore
        const reportsSnap = await getDocs(qQuery);

        if (reportsSnap.empty) {
          setError('No test reports found for the selected SKU with the applied filters.');
          setLoading(false);
          return;
        }

        // Parse start and end dates into Firestore Timestamps
        const startDateObj = startDate ? Timestamp.fromDate(new Date(startDate)) : null;
        const endDateObj = endDate ? Timestamp.fromDate(new Date(endDate)) : null;

        // Filter reports by date if filters are provided
        const filteredReports = reportsSnap.docs.filter((doc) => {
          const reportDate = doc.data().date;
          let includeReport = true;
          if (startDateObj && reportDate < startDateObj) {
            includeReport = false;
          }
          if (endDateObj && reportDate > endDateObj) {
            includeReport = false;
          }

          return includeReport;
        });

        if (filteredReports.length === 0) {
          setError('No test reports found for the selected SKU within the chosen date range.');
          setLoading(false);
          setRawReports([]); // Clear rawReports if no data
          return;
        }

        // Store raw reports data
        const rawData = filteredReports.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date && doc.data().date.toDate ? doc.data().date.toDate().toLocaleDateString() : doc.data().date || 'N/A',
        }));
        setRawReports(rawData);

        // If no specifications are selected, default to all
        const filteredSpecifications =
          selectedSpecifications.length > 0
            ? specificationsList.filter((spec) =>
                selectedSpecifications.includes(spec.label)
              )
            : specificationsList;

        // Initialize specData based on filteredSpecifications
        const specData = {};
        filteredSpecifications.forEach((spec) => {
          specData[spec.name] = [];
        });

        // Iterate through filtered reports and collect data for filteredSpecifications
        filteredReports.forEach((doc) => {
          const report = doc.data();
          filteredSpecifications.forEach((spec) => {
            const value = parseFloat(report[spec.name]);
            if (!isNaN(value) && isFinite(value)) {
              specData[spec.name].push(value);
            }
          });
        });

        // Log data to ensure it's populated
        console.log('Specification Data:', specData);

        // Calculate CP and CPK for each specification
        const cpResults = {};
        const cpkResults = {};

        const tempHistogramData = {};
        const tempSummaryStats = {};

        filteredSpecifications.forEach((spec, index) => { // Added index for color selection
          const data = specData[spec.name];
          if (data.length < 2) {
            cpResults[spec.label] = 'N/A';
            cpkResults[spec.label] = 'N/A';
            tempHistogramData[spec.label] = { labels: [], datasets: [] };
            tempSummaryStats[spec.label] = {
              mean: 'N/A',
              median: 'N/A',
              variance: 'N/A',
              stdDev: 'N/A',
              min: 'N/A',
              max: 'N/A',
            };
            return;
          }

          const meanValue = mean(data);
          const stdDev = std(data);
          const medianValue = median(data);
          const varianceValue = variance(data);
          const minValue = Math.min(...data);
          const maxValue = Math.max(...data);

          // Ensure that USL and LSL are properly fetched
          const USL = specifications[spec.name]?.max ?? null;
          const LSL = specifications[spec.name]?.min ?? null;

          if (USL !== null && LSL !== null) {
            // Calculate CP
            const cp = (USL - LSL) / (6 * stdDev);
            cpResults[spec.label] = parseFloat(cp.toFixed(4));

            // Calculate CPK
            const cpu = (USL - meanValue) / (3 * stdDev);
            const cpl = (meanValue - LSL) / (3 * stdDev);
            const cpk = Math.min(cpu, cpl);
            cpkResults[spec.label] = parseFloat(cpk.toFixed(4));
          } else {
            cpResults[spec.label] = 'N/A';
            cpkResults[spec.label] = 'N/A';
          }

          // Prepare Histogram Data
          const histogramBins = 10;
          const binWidth = (maxValue - minValue) / histogramBins;
          const bins = Array(histogramBins).fill(0);
          const binLabels = [];

          for (let i = 0; i < histogramBins; i++) {
            const rangeStart = (minValue + i * binWidth).toFixed(4);
            const rangeEnd = (minValue + (i + 1) * binWidth).toFixed(4);
            binLabels.push(`${rangeStart} - ${rangeEnd}`);
          }

          data.forEach((value) => {
            const binIndex = Math.min(Math.floor((value - minValue) / binWidth), histogramBins - 1);
            bins[binIndex]++;
          });

          // Assign colors from the palette
          const backgroundColor = colorPalette[index % colorPalette.length];
          const borderColor = backgroundColor.replace('0.6', '1');

          tempHistogramData[spec.label] = {
            labels: binLabels,
            datasets: [
              {
                label: `${spec.label} Distribution`,
                data: bins,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1,
              },
            ],
          };

          // Prepare Summary Statistics
          tempSummaryStats[spec.label] = {
            mean: meanValue.toFixed(4),
            median: medianValue.toFixed(4),
            variance: varianceValue.toFixed(4),
            stdDev: stdDev.toFixed(4),
            min: minValue.toFixed(4),
            max: maxValue.toFixed(4),
          };
        });

        setCpData(cpResults);
        setCpkData(cpkResults);
        setHistogramData(tempHistogramData);
        setSummaryStats(tempSummaryStats);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data. Please try again.');
        setRawReports([]); // Clear rawReports on error
      } finally {
        setLoading(false);
      }
    },
  });

  // Define state variables after formik
  const [cpData, setCpData] = useState(null);
  const [cpkData, setCpkData] = useState(null);
  const [histogramData, setHistogramData] = useState({});
  const [summaryStats, setSummaryStats] = useState({});
  const [rawReports, setRawReports] = useState([]); // New state for raw reports
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef(null); // Reference to capture results for PDF export

  // State variables for SKUs
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [skuError, setSkuError] = useState('');

  // State variables for Revisions
  const [revisionOptions, setRevisionOptions] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [revisionFetchError, setRevisionFetchError] = useState('');

  // Create refs for each chart
  const chartRefs = useRef({});

  // State for Fullscreen Chart Modal
  const [openChartModal, setOpenChartModal] = useState(false);
  const [selectedChartSpec, setSelectedChartSpec] = useState(null);

  // Fetch SKUs from Firestore on component mount
  useEffect(() => {
    const fetchSkus = async () => {
      setLoadingSkus(true);
      setSkuError('');
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const skus = productsSnapshot.docs.map((doc) => ({
          label: doc.id, // Assuming SKU is the document ID
          id: doc.id,
          name: doc.data().name || '', // Assuming each product has a 'name' field
        }));
        setSkuOptions(skus);
      } catch (err) {
        console.error('Error fetching SKUs:', err);
        setSkuError('Failed to load SKUs. Please try again.');
      } finally {
        setLoadingSkus(false);
      }
    };

    fetchSkus();
  }, []);

  // Fetch Revisions when SKU changes
  useEffect(() => {
    const fetchRevisions = async (selectedSku) => {
      if (!selectedSku) {
        setRevisionOptions([]);
        return;
      }

      setLoadingRevisions(true);
      setRevisionFetchError('');
      try {
        const revisionsCollection = collection(db, 'products', selectedSku.id, 'revisions');
        const revisionsSnapshot = await getDocs(revisionsCollection);
        const revisions = revisionsSnapshot.docs.map((doc) => ({
          label: doc.id, // Assuming revision name is the document ID
          id: doc.id,
        }));
        // Add an option for "All Revisions"
        setRevisionOptions([{ label: 'All Revisions', id: 'ALL' }, ...revisions]);
      } catch (err) {
        console.error('Error fetching revisions:', err);
        setRevisionFetchError('Failed to load revisions. Please try again.');
      } finally {
        setLoadingRevisions(false);
      }
    };

    // Trigger fetchRevisions when SKU changes
    if (formik.values.sku) {
      fetchRevisions(formik.values.sku);
      // Reset revisions selection when SKU changes
      formik.setFieldValue('revisions', []);
    } else {
      setRevisionOptions([]);
      formik.setFieldValue('revisions', []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.sku]);

  // Helper function to convert image URL to base64
  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/jpeg'); // Adjust image type if needed
        resolve(dataURL);
      };

      img.onerror = (err) => {
        reject(err);
      };

      img.src = url;
    });
  };

  // Export to PDF Function
  const exportToPDF = async () => {
    // Existing PDF export code remains unchanged
    // Ensure to update any references to 'toothSet' to 'toothSetLeft' and 'toothSetRight' if needed
    const docPDF = new jsPDF('p', 'mm', 'a4');
    const pageWidth = docPDF.internal.pageSize.getWidth();
    const margin = 15;
    let yOffset = margin;

    // Cover Page
    docPDF.setFontSize(22);
    docPDF.text('Analysis Report', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    docPDF.setFontSize(16);
    docPDF.text(`SKU: ${formik.values.sku?.label}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    docPDF.setFontSize(12);
    docPDF.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 30;

    // Summary Statistics
    if (Object.keys(summaryStats).length > 0) {
      docPDF.setFontSize(16);
      docPDF.text('Summary Statistics', margin, yOffset);
      yOffset += 10;

      // Prepare data for autoTable
      const summaryData = Object.entries(summaryStats).map(([spec, stats]) => [
        spec,
        stats.mean,
        stats.median,
        stats.variance,
        stats.stdDev,
        stats.min,
        stats.max,
      ]);

      docPDF.autoTable({
        head: [['Specification', 'Mean', 'Median', 'Variance', 'Std Dev', 'Min', 'Max']],
        body: summaryData,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [78, 184, 87] }, // Applied color #4eb857
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [78, 184, 87],
        },
        columnStyles: {
          0: { halign: 'left' }, // Specification column aligned left
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // CP and CPK Values
    if (cpData && cpkData) {
      docPDF.setFontSize(16);
      docPDF.text('CP and CPK Values', margin, yOffset);
      yOffset += 10;

      // Prepare data for autoTable
      const cpCpkData = Object.entries(cpData).map(([spec, cp]) => [
        spec,
        cp !== 'N/A' ? cp : 'N/A',
        cpkData[spec] !== 'N/A' ? cpkData[spec] : 'N/A',
      ]);

      docPDF.autoTable({
        head: [['Specification', 'CP', 'CPK']],
        body: cpCpkData,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [78, 184, 87] }, // Applied color #4eb857
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [78, 184, 87],
        },
        columnStyles: {
          0: { halign: 'left' }, // Specification column aligned left
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // Measurement Distributions
    if (Object.keys(histogramData).length > 0) {
      docPDF.setFontSize(16);
      docPDF.text('Measurement Distributions', margin, yOffset);
      yOffset += 10;

      for (const spec of specificationsList.filter(spec =>
        formik.values.selectedSpecifications.length > 0
          ? formik.values.selectedSpecifications.includes(spec.label)
          : true
      )) {
        const specLabel = spec.label;
        if (histogramData[specLabel] && histogramData[specLabel].labels?.length > 0) {
          // Capture the chart as an image
          const chartContainer = document.getElementById(`chart-${specLabel}`);
          if (chartContainer) {
            const canvas = chartContainer.querySelector('canvas');
            if (canvas) {
              const imgData = canvas.toDataURL('image/png', 1.0);

              // Validate imgData
              if (!imgData || imgData.length < 100) {
                console.error(`Invalid image data for ${specLabel}`);
                continue; // Skip adding this image
              }

              // Add chart title
              docPDF.setFontSize(12);
              docPDF.text(`${specLabel} Distribution`, margin, yOffset);
              yOffset += 5;

              // Add the image
              const imgWidth = pageWidth - 2 * margin;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              if (yOffset + imgHeight > docPDF.internal.pageSize.getHeight() - margin) {
                docPDF.addPage();
                yOffset = margin;
              }
              docPDF.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
              yOffset += imgHeight + 10;
            }
          }
        }
      }
    }

    // Footer with page numbers
    const pageCount = docPDF.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      docPDF.setPage(i);
      docPDF.setFontSize(10);
      docPDF.text(`Page ${i} of ${pageCount}`, pageWidth - margin, docPDF.internal.pageSize.getHeight() - 10, {
        align: 'right',
      });
    }

    // Save the PDF
    docPDF.save('analysis-report.pdf');
  };

  // Excel Export Function
  const exportToExcel = () => {
    // Existing Excel export code remains unchanged
    // Ensure to update any references to 'toothSet' to 'toothSetLeft' and 'toothSetRight' if needed

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Summary Statistics Sheet
    if (Object.keys(summaryStats).length > 0) {
      const summaryData = [
        ['Specification', 'Mean', 'Median', 'Variance', 'Std Dev', 'Min', 'Max'],
        ...Object.entries(summaryStats).map(([spec, stats]) => [
          spec,
          stats.mean,
          stats.median,
          stats.variance,
          stats.stdDev,
          stats.min,
          stats.max,
        ]),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Statistics');
    }

    // CP and CPK Values Sheet
    if (cpData && cpkData) {
      const cpCpkData = [
        ['Specification', 'CP', 'CPK'],
        ...Object.entries(cpData).map(([spec, cp]) => [
          spec,
          cp !== 'N/A' ? cp : 'N/A',
          cpkData[spec] !== 'N/A' ? cpkData[spec] : 'N/A',
        ]),
      ];
      const wsCpCpk = XLSX.utils.aoa_to_sheet(cpCpkData);
      XLSX.utils.book_append_sheet(wb, wsCpCpk, 'CP and CPK Values');
    }

    // Write the workbook and trigger download
    XLSX.writeFile(wb, 'analysis-report.xlsx');
  };

  // Export Raw Data to PDF Function (Updated to move logo to top right and make it bigger)
  const exportRawDataToPDF = async () => {
    if (rawReports.length === 0) {
      setError('No raw data available to export.');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4'); // 'landscape' for wider tables
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yOffset = margin;

    try {
      // Fetch the logo and convert to base64
      const logoURL = `${window.location.origin}/images/BT.jpg`;
      const logoData = await getBase64ImageFromURL(logoURL);

      // Add Logo to the PDF (aligned to the right)
      const imgProps = doc.getImageProperties(logoData);
      const imgWidth = 50; // Increased width from 30 to 50
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const xPosition = pageWidth - margin - imgWidth;
      doc.addImage(logoData, 'JPEG', xPosition, yOffset, imgWidth, imgHeight);
      
      // Add Title aligned to the left
      doc.setFontSize(22);
      doc.text('Milwaukee Test Report Sheet', margin, yOffset + imgHeight / 2, { align: 'left' });
      
      yOffset += imgHeight + 5; // Reduced spacing below the title

      // Add Subheading aligned to the left
      doc.setFontSize(16);
      doc.text('BT-MET020 Rev. 1 Apr-24', margin, yOffset, { align: 'left' });
      yOffset += 6; // Reduced spacing below the subheading

      // Add SKU information as subheading (aligned to the left)
      const skuId = formik.values.sku?.label || 'N/A';
      const subheading = `SKU: ${skuId}`;
      doc.setFontSize(16);
      doc.text(subheading, margin, yOffset, { align: 'left' });
      yOffset += 4; // Reduced spacing below the SKU information

      // Add some spacing after the title and subheadings
      yOffset += 1; // Reduced additional spacing

      // Table Headers - Adjusted as per user request
      const headers = [
        ['', 'QC', '1', 'N/A', '20', '16', '17,18', '2', 'N/A'],
        ['', 'Nominal', '2.382', '1.373', '0.830', '1.200', '0.007', '0.025', '0.0025'],
        ['', 'Tol', '±0.005', '±0.005', '±0.005', '±0.005', '0.003', '±0.001', 'Max', ''],
        ['Laser Mc No.', 'Sample count', 'Height', 'Blade Width', 'Blade Body', 'Blade Bottom', 'Tooth Set', 'Gauge', 'Dross', 'Batch']
      ];

      // Table Data - Exclude 'id', 'date', and 'revision' fields
      const tableData = rawReports.map(report => [
        report.machine || 'N/A', // Laser Mc No.
        report.sampleCount || 'N/A',
        report.height !== undefined && report.height !== null ? `${report.height}` : 'N/A',
        report.bladeWidth !== undefined && report.bladeWidth !== null ? `${report.bladeWidth}` : 'N/A',
        report.bladeBody !== undefined && report.bladeBody !== null ? `${report.bladeBody}` : 'N/A',
        report.bladeBottom !== undefined && report.bladeBottom !== null ? `${report.bladeBottom}` : 'N/A',
        (report.toothSetLeft !== undefined && report.toothSetLeft !== null) && (report.toothSetRight !== undefined && report.toothSetRight !== null)
          ? `Left: ${report.toothSetLeft}\nRight: ${report.toothSetRight}`
          : report.toothSetLeft !== undefined && report.toothSetLeft !== null
          ? `Left: ${report.toothSetLeft}`
          : report.toothSetRight !== undefined && report.toothSetRight !== null
          ? `Right: ${report.toothSetRight}`
          : 'N/A', // Tooth Set
        report.gauge !== undefined && report.gauge !== null ? `${report.gauge}` : 'N/A',
        report.dross || 'N/A',
        report.batch || 'N/A',
      ]);

      // Adding Table to the PDF
      doc.autoTable({
        head: headers,
        body: tableData,
        startY: yOffset,
        theme: 'grid', // Grid theme for clear borders
        headStyles: { fillColor: [78, 184, 87] }, // Applied color #4eb857
        styles: {
          fontSize: 8,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [78, 184, 87],
          cellPadding: 1, // Reduced cell padding for less vertical space
          lineHeight: 1,   // Added lineHeight for tighter spacing
          // Removed cellHeight: 6,
        },
        columnStyles: {
          0: { halign: 'left' }, // Laser Mc No. column aligned left
          6: { halign: 'left' }, // Tooth Set column aligned left
        },
        margin: { left: margin, right: margin },
        tableLineColor: [78, 184, 87],
        tableLineWidth: 0.1,
        didDrawCell: (data) => {
          if (data.cell.section === 'head') {
            // Bold the main headers
            if (data.column.index === 0 || data.column.index === 1 || data.column.index === 6) {
              data.cell.styles.fontStyle = 'bold';
            }
          }

          if (data.cell.section === 'body') {
            // Handle multi-line cells for specifications
            if (['Height', 'Blade Width', 'Blade Body', 'Blade Bottom', 'Gauge'].includes(data.column.header)) {
              const lines = data.cell.text[0].split('\n');
              data.cell.text = lines;
              data.cell.styles.valign = 'middle';
            }
            if (data.column.header === 'Tooth Set') {
              const lines = data.cell.text[0].split('\n');
              data.cell.text = lines;
              data.cell.styles.valign = 'middle';
            }
          }
        },
      });

      // Footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, {
          align: 'right',
        });
      }

      // Save the PDF
      doc.save('raw-data-report.pdf');
    } catch (err) {
      console.error('Error generating raw data PDF:', err);
      setError('An error occurred while generating the raw data PDF. Please try again.');
    }
  };

  // Handle Chart Click for Fullscreen
  const handleChartClick = (specLabel) => {
    setSelectedChartSpec(specLabel);
    setOpenChartModal(true);
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        px: isMobile ? 1 : 3, // Reduced horizontal padding on mobile
        py: 2, // Consistent vertical padding
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 3,
        mx: 'auto',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Analysis Page
      </Typography>

      {/* Form */}
      <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          {/* SKU Autocomplete */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              id="sku"
              name="sku"
              options={skuOptions}
              getOptionLabel={(option) => `${option.label} - ${option.name}`}
              loading={loadingSkus}
              onChange={(event, value) => formik.setFieldValue('sku', value)}
              onBlur={formik.handleBlur}
              value={formik.values.sku}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="SKU"
                  required
                  error={formik.touched.sku && Boolean(formik.errors.sku)}
                  helperText={formik.touched.sku && formik.errors.sku}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingSkus ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Revisions Autocomplete */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              id="revisions"
              name="revisions"
              options={revisionOptions}
              getOptionLabel={(option) => option.label}
              loading={loadingRevisions}
              onChange={(event, value) => formik.setFieldValue('revisions', value)}
              onBlur={formik.handleBlur}
              value={formik.values.revisions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Revisions"
                  required
                  error={formik.touched.revisions && Boolean(formik.errors.revisions)}
                  helperText={formik.touched.revisions && formik.errors.revisions}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingRevisions ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={formik.values.startDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={formik.touched.startDate && Boolean(formik.errors.startDate)}
              helperText={formik.touched.startDate && formik.errors.startDate}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={formik.values.endDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={formik.touched.endDate && Boolean(formik.errors.endDate)}
              helperText={formik.touched.endDate && formik.errors.endDate}
            />
          </Grid>

          {/* Machine Input */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Machine"
              name="selectedMachine"
              value={formik.values.selectedMachine}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              error={formik.touched.selectedMachine && Boolean(formik.errors.selectedMachine)}
              helperText={formik.touched.selectedMachine && formik.errors.selectedMachine}
              inputProps={{
                pattern: '^[A-Za-z0-9\\s-]+$',
                title: 'Machine identifier can include letters, numbers, spaces, and hyphens.',
              }}
            />
          </Grid>

          {/* Specification Selector */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              id="selectedSpecifications"
              options={specificationsList.map((spec) => spec.label)}
              value={formik.values.selectedSpecifications}
              onChange={(event, newValue) => {
                formik.setFieldValue('selectedSpecifications', newValue);
              }}
              onBlur={formik.handleBlur}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Specifications"
                  placeholder="Specifications"
                  error={
                    formik.touched.selectedSpecifications &&
                    Boolean(formik.errors.selectedSpecifications)
                  }
                  helperText={
                    formik.touched.selectedSpecifications &&
                    formik.errors.selectedSpecifications
                  }
                />
              )}
            />
          </Grid>

          {/* Analyze Button */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Display SKU fetching error */}
      {skuError && <Alert severity="error" sx={{ mb: 2 }}>{skuError}</Alert>}

      {/* Display Revisions fetching error */}
      {revisionFetchError && <Alert severity="error" sx={{ mb: 2 }}>{revisionFetchError}</Alert>}

      {/* Display Error if any */}
      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {/* Display Success Message */}
      {!error && !loading && cpData && cpkData && (
        <Alert severity="success" sx={{ mb: 4 }}>Analysis completed successfully!</Alert>
      )}

      {/* Results Section */}
      <div ref={resultRef}>
        {Object.keys(summaryStats).length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics for SKU: {formik.values.sku?.label}
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="summary statistics table">
                <TableHead>
                  <TableRow>
                    <TableCell>Specification</TableCell>
                    <TableCell align="right">Mean</TableCell>
                    <TableCell align="right">Median</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell align="right">Std Dev</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Max</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summaryStats).map(([spec, stats]) => (
                    <TableRow key={spec}>
                      <TableCell component="th" scope="row">{spec}</TableCell>
                      <TableCell align="right">{stats.mean}</TableCell>
                      <TableCell align="right">{stats.median}</TableCell>
                      <TableCell align="right">{stats.variance}</TableCell>
                      <TableCell align="right">{stats.stdDev}</TableCell>
                      <TableCell align="right">{stats.min}</TableCell>
                      <TableCell align="right">{stats.max}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* CP and CPK Values Table */}
        {cpData && cpkData && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" gutterBottom>
              CP and CPK Values for SKU: {formik.values.sku?.label}
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="cp cpk table">
                <TableHead>
                  <TableRow>
                    <TableCell>Specification</TableCell>
                    <TableCell align="right">CP</TableCell>
                    <TableCell align="right">CPK</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {specificationsList
                    .filter(spec => 
                      formik.values.selectedSpecifications.length > 0 
                        ? formik.values.selectedSpecifications.includes(spec.label) 
                        : true
                    )
                    .map((spec) => (
                      <TableRow key={spec.label}>
                        <TableCell component="th" scope="row">{spec.label}</TableCell>
                        <TableCell align="right">
                          {cpData[spec.label] !== 'N/A' ? cpData[spec.label] : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {cpkData[spec.label] !== 'N/A' ? cpkData[spec.label] : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Histograms (Visible in UI and used for PDF) */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" gutterBottom>
            Measurement Distributions for SKU: {formik.values.sku?.label}
          </Typography>
          <Grid container spacing={4}>
            {specificationsList
              .filter(spec => 
                formik.values.selectedSpecifications.length > 0
                  ? formik.values.selectedSpecifications.includes(spec.label)
                  : true
              )
              .map((spec) => (
                <Grid item xs={12} md={6} key={spec.label}>
                  <Typography variant="subtitle1" gutterBottom>
                    {spec.label}
                  </Typography>
                  {histogramData[spec.label] && histogramData[spec.label].labels?.length > 0 ? (
                    <Box
                      id={`chart-${spec.label}`}
                      onClick={() => handleChartClick(spec.label)}
                      sx={{ cursor: 'pointer', position: 'relative', height: 0, paddingBottom: '50%' }} // Responsive container
                    >
                      <Bar
                        ref={(el) => { chartRefs.current[spec.label] = el; }}
                        data={histogramData[spec.label]}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false, // Allows dynamic resizing
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true },
                          },
                          scales: {
                            x: {
                              title: { display: true, text: 'Measurement Range', font: { size: 14, weight: 'bold' } },
                              ticks: { font: { size: 12 } },
                              grid: { display: false },
                            },
                            y: {
                              title: { display: true, text: 'Frequency', font: { size: 14, weight: 'bold' } },
                              ticks: { stepSize: 1, font: { size: 12 } },
                              grid: { color: 'rgba(200, 200, 200, 0.2)', borderDash: [5, 5] },
                            },
                          },
                        }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} // Fill the container
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2">
                      Not enough data to display histogram.
                    </Typography>
                  )}
                </Grid>
              ))}
          </Grid>
        </Box>
      </div>

      {/* Export Buttons */}
      <Box sx={{ mb: 6, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" color="secondary" onClick={exportToPDF}>
          Export to PDF
        </Button>
        <Button variant="contained" color="primary" onClick={exportToExcel}>
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={exportRawDataToPDF}
          disabled={rawReports.length === 0}
        >
          Export Raw Data to PDF
        </Button>
      </Box>

      {/* Chart Modal */}
      <Dialog
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        fullScreen
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setOpenChartModal(false)} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {selectedChartSpec} Distribution
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2, position: 'relative', height: '100%', width: '100%' }}>
          {selectedChartSpec && histogramData[selectedChartSpec] && (
            <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
              <Bar
                data={histogramData[selectedChartSpec]}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Allows dynamic resizing
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Measurement Range', font: { size: 18, weight: 'bold' } },
                      ticks: { font: { size: 16 } },
                      grid: { display: false },
                    },
                    y: {
                      title: { display: true, text: 'Frequency', font: { size: 18, weight: 'bold' } },
                      ticks: { stepSize: 1, font: { size: 16 } },
                      grid: { color: 'rgba(200, 200, 200, 0.2)', borderDash: [5, 5] },
                    },
                  },
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} // Fill the container
              />
            </Box>
          )}
        </Box>
      </Dialog>
    </Container>
  );
}

export default Analysis;
