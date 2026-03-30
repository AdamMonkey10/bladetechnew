// src/components/CompareMachines.js

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

function CompareMachines() {
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
      machine1: '', // Changed from null to empty string
      machine2: '', // Changed from null to empty string
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
      machine1: Yup.string()
        .required('First machine is required'),
      machine2: Yup.string()
        .required('Second machine is required')
        .notOneOf([Yup.ref('machine1')], 'Machines must be different'),
    }),
    onSubmit: async (values) => {
      if (!values.sku) {
        setError('Please select a valid SKU.');
        return;
      }

      setLoading(true);
      setError('');
      setCpData1(null);
      setCpkData1(null);
      setCpData2(null);
      setCpkData2(null);
      setHistogramData1({});
      setHistogramData2({});
      setSummaryStats1({});
      setSummaryStats2({});
      // Removed: setRawReports1([]);
      // Removed: setRawReports2([]);

      const { sku, revisions, startDate, endDate, selectedSpecifications, machine1, machine2 } = values;

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

        // Build the Firestore query for Machine 1
        let qQuery1 = query(
          collection(db, 'milwaukeeTestReports'),
          where('sku', '==', sku.id),
          where('machine', '==', machine1.trim()) // Use trimmed input
        );

        // Build the Firestore query for Machine 2
        let qQuery2 = query(
          collection(db, 'milwaukeeTestReports'),
          where('sku', '==', sku.id),
          where('machine', '==', machine2.trim()) // Use trimmed input
        );

        // Apply revisions filter (excluding "All Revisions")
        if (!revisions.some(rev => rev.id === 'ALL')) {
          // Firestore 'in' queries can have up to 10 elements
          if (revisions.length > 10) {
            setError('Cannot select more than 10 revisions due to Firestore limitations.');
            setLoading(false);
            return;
          }
          qQuery1 = query(qQuery1, where('revision', 'in', revisions.map(rev => rev.id)));
          qQuery2 = query(qQuery2, where('revision', 'in', revisions.map(rev => rev.id)));
        }

        // Parse start and end dates into Firestore Timestamps
        const startDateObj = startDate ? Timestamp.fromDate(new Date(startDate)) : null;
        const endDateObj = endDate ? Timestamp.fromDate(new Date(endDate)) : null;

        // Apply date filters
        if (startDateObj) {
          qQuery1 = query(qQuery1, where('date', '>=', startDateObj));
          qQuery2 = query(qQuery2, where('date', '>=', startDateObj));
        }
        if (endDateObj) {
          qQuery1 = query(qQuery1, where('date', '<=', endDateObj));
          qQuery2 = query(qQuery2, where('date', '<=', endDateObj));
        }

        // Fetch reports for Machine 1
        const reportsSnap1 = await getDocs(qQuery1);
        if (reportsSnap1.empty) {
          setError(`No test reports found for Machine 1 (${machine1}) with the applied filters. Please ensure the machine exists.`);
          setLoading(false);
          return;
        }

        // Fetch reports for Machine 2
        const reportsSnap2 = await getDocs(qQuery2);
        if (reportsSnap2.empty) {
          setError(`No test reports found for Machine 2 (${machine2}) with the applied filters. Please ensure the machine exists.`);
          setLoading(false);
          return;
        }

        // If no specifications are selected, default to all
        const filteredSpecifications =
          selectedSpecifications.length > 0
            ? specificationsList.filter((spec) =>
                selectedSpecifications.includes(spec.label)
              )
            : specificationsList;

        // Initialize specData based on filteredSpecifications for both machines
        const specData1 = {};
        const specData2 = {};
        filteredSpecifications.forEach((spec) => {
          specData1[spec.name] = [];
          specData2[spec.name] = [];
        });

        // Collect data for Machine 1
        reportsSnap1.docs.forEach((doc) => {
          const report = doc.data();
          filteredSpecifications.forEach((spec) => {
            const value = parseFloat(report[spec.name]);
            if (!isNaN(value) && isFinite(value)) {
              specData1[spec.name].push(value);
            }
          });
        });

        // Collect data for Machine 2
        reportsSnap2.docs.forEach((doc) => {
          const report = doc.data();
          filteredSpecifications.forEach((spec) => {
            const value = parseFloat(report[spec.name]);
            if (!isNaN(value) && isFinite(value)) {
              specData2[spec.name].push(value);
            }
          });
        });

        // Calculate CP and CPK for each specification for both machines
        const cpResults1 = {};
        const cpkResults1 = {};
        const cpResults2 = {};
        const cpkResults2 = {};

        const tempHistogramData1 = {};
        const tempHistogramData2 = {};
        const tempSummaryStats1 = {};
        const tempSummaryStats2 = {};

        filteredSpecifications.forEach((spec, index) => { // Added index for color selection
          // Machine 1
          const data1 = specData1[spec.name];
          if (data1.length < 2) {
            cpResults1[spec.label] = 'N/A';
            cpkResults1[spec.label] = 'N/A';
            tempHistogramData1[spec.label] = { labels: [], datasets: [] };
            tempSummaryStats1[spec.label] = {
              mean: 'N/A',
              median: 'N/A',
              variance: 'N/A',
              stdDev: 'N/A',
              min: 'N/A',
              max: 'N/A',
            };
          } else {
            const meanValue1 = mean(data1);
            const stdDev1 = std(data1);
            const medianValue1 = median(data1);
            const varianceValue1 = variance(data1);
            const minValue1 = Math.min(...data1);
            const maxValue1 = Math.max(...data1);

            const USL = specifications[spec.name]?.max ?? null;
            const LSL = specifications[spec.name]?.min ?? null;

            if (USL !== null && LSL !== null) {
              const cp1 = (USL - LSL) / (6 * stdDev1);
              cpResults1[spec.label] = parseFloat(cp1.toFixed(4));

              const cpu1 = (USL - meanValue1) / (3 * stdDev1);
              const cpl1 = (meanValue1 - LSL) / (3 * stdDev1);
              const cpk1 = Math.min(cpu1, cpl1);
              cpkResults1[spec.label] = parseFloat(cpk1.toFixed(4));
            } else {
              cpResults1[spec.label] = 'N/A';
              cpkResults1[spec.label] = 'N/A';
            }

            // Prepare Histogram Data for Machine 1
            const histogramBins = 10;
            const binWidth1 = (maxValue1 - minValue1) / histogramBins;
            const bins1 = Array(histogramBins).fill(0);
            const binLabels1 = [];

            for (let i = 0; i < histogramBins; i++) {
              const rangeStart = (minValue1 + i * binWidth1).toFixed(4);
              const rangeEnd = (minValue1 + (i + 1) * binWidth1).toFixed(4);
              binLabels1.push(`${rangeStart} - ${rangeEnd}`);
            }

            data1.forEach((value) => {
              const binIndex = Math.min(Math.floor((value - minValue1) / binWidth1), histogramBins - 1);
              bins1[binIndex]++;
            });

            const backgroundColor1 = colorPalette[index % colorPalette.length];
            const borderColor1 = backgroundColor1.replace('0.6', '1');

            tempHistogramData1[spec.label] = {
              labels: binLabels1,
              datasets: [
                {
                  label: `${spec.label} Distribution (${machine1})`,
                  data: bins1,
                  backgroundColor: backgroundColor1,
                  borderColor: borderColor1,
                  borderWidth: 1,
                },
              ],
            };

            // Summary Statistics for Machine 1
            tempSummaryStats1[spec.label] = {
              mean: meanValue1.toFixed(4),
              median: medianValue1.toFixed(4),
              variance: varianceValue1.toFixed(4),
              stdDev: stdDev1.toFixed(4),
              min: minValue1.toFixed(4),
              max: maxValue1.toFixed(4),
            };
          }

          // Machine 2
          const data2 = specData2[spec.name];
          if (data2.length < 2) {
            cpResults2[spec.label] = 'N/A';
            cpkResults2[spec.label] = 'N/A';
            tempHistogramData2[spec.label] = { labels: [], datasets: [] };
            tempSummaryStats2[spec.label] = {
              mean: 'N/A',
              median: 'N/A',
              variance: 'N/A',
              stdDev: 'N/A',
              min: 'N/A',
              max: 'N/A',
            };
          } else {
            const meanValue2 = mean(data2);
            const stdDev2 = std(data2);
            const medianValue2 = median(data2);
            const varianceValue2 = variance(data2);
            const minValue2 = Math.min(...data2);
            const maxValue2 = Math.max(...data2);

            const USL = specifications[spec.name]?.max ?? null;
            const LSL = specifications[spec.name]?.min ?? null;

            if (USL !== null && LSL !== null) {
              const cp2 = (USL - LSL) / (6 * stdDev2);
              cpResults2[spec.label] = parseFloat(cp2.toFixed(4));

              const cpu2 = (USL - meanValue2) / (3 * stdDev2);
              const cpl2 = (meanValue2 - LSL) / (3 * stdDev2);
              const cpk2 = Math.min(cpu2, cpl2);
              cpkResults2[spec.label] = parseFloat(cpk2.toFixed(4));
            } else {
              cpResults2[spec.label] = 'N/A';
              cpkResults2[spec.label] = 'N/A';
            }

            // Prepare Histogram Data for Machine 2
            const histogramBins = 10;
            const binWidth2 = (maxValue2 - minValue2) / histogramBins;
            const bins2 = Array(histogramBins).fill(0);
            const binLabels2 = [];

            for (let i = 0; i < histogramBins; i++) {
              const rangeStart = (minValue2 + i * binWidth2).toFixed(4);
              const rangeEnd = (minValue2 + (i + 1) * binWidth2).toFixed(4);
              binLabels2.push(`${rangeStart} - ${rangeEnd}`);
            }

            data2.forEach((value) => {
              const binIndex = Math.min(Math.floor((value - minValue2) / binWidth2), histogramBins - 1);
              bins2[binIndex]++;
            });

            const backgroundColor2 = colorPalette[(index + 1) % colorPalette.length];
            const borderColor2 = backgroundColor2.replace('0.6', '1');

            tempHistogramData2[spec.label] = {
              labels: binLabels2,
              datasets: [
                {
                  label: `${spec.label} Distribution (${machine2})`,
                  data: bins2,
                  backgroundColor: backgroundColor2,
                  borderColor: borderColor2,
                  borderWidth: 1,
                },
              ],
            };

            // Summary Statistics for Machine 2
            tempSummaryStats2[spec.label] = {
              mean: meanValue2.toFixed(4),
              median: medianValue2.toFixed(4),
              variance: varianceValue2.toFixed(4),
              stdDev: stdDev2.toFixed(4),
              min: minValue2.toFixed(4),
              max: maxValue2.toFixed(4),
            };
          }
        });

        setCpData1(cpResults1);
        setCpkData1(cpkResults1);
        setCpData2(cpResults2);
        setCpkData2(cpkResults2);
        setHistogramData1(tempHistogramData1);
        setHistogramData2(tempHistogramData2);
        setSummaryStats1(tempSummaryStats1);
        setSummaryStats2(tempSummaryStats2);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data. Please try again.');
        // Removed: setRawReports1([]);
        // Removed: setRawReports2([]);
      } finally {
        setLoading(false);
      }
    },
  });

  // Define state variables after formik
  const [cpData1, setCpData1] = useState(null);
  const [cpkData1, setCpkData1] = useState(null);
  const [cpData2, setCpData2] = useState(null);
  const [cpkData2, setCpkData2] = useState(null);
  const [histogramData1, setHistogramData1] = useState({});
  const [histogramData2, setHistogramData2] = useState({});
  const [summaryStats1, setSummaryStats1] = useState({});
  const [summaryStats2, setSummaryStats2] = useState({});
  // Removed: const [rawReports1, setRawReports1] = useState([]);
  // Removed: const [rawReports2, setRawReports2] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef(null); // Reference to capture results for PDF export

  // State variables for SKUs
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  // Removed: const [skuError, setSkuError] = useState('');

  // State variables for Revisions
  const [revisionOptions, setRevisionOptions] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  // Removed: const [revisionFetchError, setRevisionFetchError] = useState('');

  // Create refs for each chart
  const chartRefs1 = useRef({});
  const chartRefs2 = useRef({});

  // State for Fullscreen Chart Modal
  const [openChartModal, setOpenChartModal] = useState(false);
  const [selectedChartSpec, setSelectedChartSpec] = useState(null);
  const [selectedMachineForChart, setSelectedMachineForChart] = useState('');

  // Fetch SKUs from Firestore on component mount
  useEffect(() => {
    const fetchSkus = async () => {
      setLoadingSkus(true);
      // Removed: setSkuError('');
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
        // Removed: setSkuError('Failed to load SKUs. Please try again.');
        setError('Failed to load SKUs. Please try again.');
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
      // Removed: setRevisionFetchError('');
      try {
        // Fetch Revisions
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
        // Removed: setRevisionFetchError('Failed to load revisions. Please try again.');
        setError('Failed to load revisions. Please try again.');
      } finally {
        setLoadingRevisions(false);
      }
    };

    // Trigger fetchRevisions when SKU changes
    if (formik.values.sku) {
      fetchRevisions(formik.values.sku);
      // Reset revisions and machines selection when SKU changes
      formik.setFieldValue('revisions', []);
      formik.setFieldValue('machine1', '');
      formik.setFieldValue('machine2', '');
    } else {
      setRevisionOptions([]);
      formik.setFieldValue('revisions', []);
      formik.setFieldValue('machine1', '');
      formik.setFieldValue('machine2', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.sku]);

  // Removed: getBase64ImageFromURL function

  // Export to PDF Function
  const exportToPDF = async () => {
    const docPDF = new jsPDF('p', 'mm', 'a4');
    const pageWidth = docPDF.internal.pageSize.getWidth();
    const margin = 15;
    let yOffset = margin;

    // Cover Page
    docPDF.setFontSize(22);
    docPDF.text('Machine Comparison Report', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    docPDF.setFontSize(16);
    docPDF.text(`SKU: ${formik.values.sku?.label}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    docPDF.setFontSize(12);
    docPDF.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 30;

    // Summary Statistics for Machine 1
    if (Object.keys(summaryStats1).length > 0) {
      docPDF.setFontSize(16);
      docPDF.text(`Summary Statistics for ${formik.values.machine1}`, margin, yOffset);
      yOffset += 10;

      const summaryData1 = Object.entries(summaryStats1).map(([spec, stats]) => [
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
        body: summaryData1,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [54, 162, 235] }, // Blue for Machine 1
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [54, 162, 235],
        },
        columnStyles: {
          0: { halign: 'left' },
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // Summary Statistics for Machine 2
    if (Object.keys(summaryStats2).length > 0) {
      docPDF.setFontSize(16);
      docPDF.text(`Summary Statistics for ${formik.values.machine2}`, margin, yOffset);
      yOffset += 10;

      const summaryData2 = Object.entries(summaryStats2).map(([spec, stats]) => [
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
        body: summaryData2,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [255, 99, 132] }, // Red for Machine 2
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [255, 99, 132],
        },
        columnStyles: {
          0: { halign: 'left' },
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // CP and CPK Values for Machine 1
    if (cpData1 && cpkData1) {
      docPDF.setFontSize(16);
      docPDF.text(`CP and CPK Values for ${formik.values.machine1}`, margin, yOffset);
      yOffset += 10;

      const cpCpkData1 = Object.entries(cpData1).map(([spec, cp]) => [
        spec,
        cp !== 'N/A' ? cp : 'N/A',
        cpkData1[spec] !== 'N/A' ? cpkData1[spec] : 'N/A',
      ]);

      docPDF.autoTable({
        head: [['Specification', 'CP', 'CPK']],
        body: cpCpkData1,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [54, 162, 235] }, // Blue for Machine 1
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [54, 162, 235],
        },
        columnStyles: {
          0: { halign: 'left' },
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // CP and CPK Values for Machine 2
    if (cpData2 && cpkData2) {
      docPDF.setFontSize(16);
      docPDF.text(`CP and CPK Values for ${formik.values.machine2}`, margin, yOffset);
      yOffset += 10;

      const cpCpkData2 = Object.entries(cpData2).map(([spec, cp]) => [
        spec,
        cp !== 'N/A' ? cp : 'N/A',
        cpkData2[spec] !== 'N/A' ? cpkData2[spec] : 'N/A',
      ]);

      docPDF.autoTable({
        head: [['Specification', 'CP', 'CPK']],
        body: cpCpkData2,
        startY: yOffset,
        theme: 'striped',
        headStyles: { fillColor: [255, 99, 132] }, // Red for Machine 2
        styles: {
          fontSize: 10,
          halign: 'right',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [255, 99, 132],
        },
        columnStyles: {
          0: { halign: 'left' },
        },
        margin: { left: margin, right: margin },
      });

      yOffset = docPDF.lastAutoTable.finalY + 10;
    }

    // Measurement Distributions
    if (Object.keys(histogramData1).length > 0 && Object.keys(histogramData2).length > 0) {
      docPDF.setFontSize(16);
      docPDF.text('Measurement Distributions', margin, yOffset);
      yOffset += 10;

      for (const spec of specificationsList.filter(spec =>
        formik.values.selectedSpecifications.length > 0
          ? formik.values.selectedSpecifications.includes(spec.label)
          : true
      )) {
        const specLabel = spec.label;
        if (
          histogramData1[specLabel] &&
          histogramData1[specLabel].labels?.length > 0 &&
          histogramData2[specLabel] &&
          histogramData2[specLabel].labels?.length > 0
        ) {
          // Capture the charts as images
          const chartContainer1 = document.getElementById(`chart1-${specLabel}`);
          const chartContainer2 = document.getElementById(`chart2-${specLabel}`);

          if (chartContainer1 && chartContainer2) {
            const canvas1 = chartContainer1.querySelector('canvas');
            const canvas2 = chartContainer2.querySelector('canvas');
            if (canvas1 && canvas2) {
              const imgData1 = canvas1.toDataURL('image/png', 1.0);
              const imgData2 = canvas2.toDataURL('image/png', 1.0);

              // Validate imgData
              if (!imgData1 || imgData1.length < 100 || !imgData2 || imgData2.length < 100) {
                console.error(`Invalid image data for ${specLabel}`);
                continue; // Skip adding these images
              }

              // Add chart titles
              docPDF.setFontSize(12);
              docPDF.text(`${specLabel} Distribution (${formik.values.machine1})`, margin, yOffset);
              docPDF.text(`${specLabel} Distribution (${formik.values.machine2})`, pageWidth / 2 + margin / 2, yOffset);
              yOffset += 5;

              // Add the images side by side
              const imgWidth = (pageWidth - 3 * margin) / 2;
              const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
              const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
              const imgHeight = Math.max(imgHeight1, imgHeight2);

              if (yOffset + imgHeight > docPDF.internal.pageSize.getHeight() - margin) {
                docPDF.addPage();
                yOffset = margin;
              }

              docPDF.addImage(imgData1, 'PNG', margin, yOffset, imgWidth, imgHeight1);
              docPDF.addImage(imgData2, 'PNG', pageWidth / 2 + margin / 2, yOffset, imgWidth, imgHeight2);
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
    docPDF.save('machine-comparison-report.pdf');
  };

  // Excel Export Function
  const exportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Summary Statistics Sheet for Machine 1
    if (Object.keys(summaryStats1).length > 0) {
      const summaryData1 = [
        ['Specification', 'Mean', 'Median', 'Variance', 'Std Dev', 'Min', 'Max'],
        ...Object.entries(summaryStats1).map(([spec, stats]) => [
          spec,
          stats.mean,
          stats.median,
          stats.variance,
          stats.stdDev,
          stats.min,
          stats.max,
        ]),
      ];
      const wsSummary1 = XLSX.utils.aoa_to_sheet(summaryData1);
      XLSX.utils.book_append_sheet(wb, wsSummary1, `${formik.values.machine1} Summary`);
    }

    // Summary Statistics Sheet for Machine 2
    if (Object.keys(summaryStats2).length > 0) {
      const summaryData2 = [
        ['Specification', 'Mean', 'Median', 'Variance', 'Std Dev', 'Min', 'Max'],
        ...Object.entries(summaryStats2).map(([spec, stats]) => [
          spec,
          stats.mean,
          stats.median,
          stats.variance,
          stats.stdDev,
          stats.min,
          stats.max,
        ]),
      ];
      const wsSummary2 = XLSX.utils.aoa_to_sheet(summaryData2);
      XLSX.utils.book_append_sheet(wb, wsSummary2, `${formik.values.machine2} Summary`);
    }

    // CP and CPK Values Sheet for Machine 1
    if (cpData1 && cpkData1) {
      const cpCpkData1 = [
        ['Specification', 'CP', 'CPK'],
        ...Object.entries(cpData1).map(([spec, cp]) => [
          spec,
          cp !== 'N/A' ? cp : 'N/A',
          cpkData1[spec] !== 'N/A' ? cpkData1[spec] : 'N/A',
        ]),
      ];
      const wsCpCpk1 = XLSX.utils.aoa_to_sheet(cpCpkData1);
      XLSX.utils.book_append_sheet(wb, wsCpCpk1, `${formik.values.machine1} CP/CPK`);
    }

    // CP and CPK Values Sheet for Machine 2
    if (cpData2 && cpkData2) {
      const cpCpkData2 = [
        ['Specification', 'CP', 'CPK'],
        ...Object.entries(cpData2).map(([spec, cp]) => [
          spec,
          cp !== 'N/A' ? cp : 'N/A',
          cpkData2[spec] !== 'N/A' ? cpkData2[spec] : 'N/A',
        ]),
      ];
      const wsCpCpk2 = XLSX.utils.aoa_to_sheet(cpCpkData2);
      XLSX.utils.book_append_sheet(wb, wsCpCpk2, `${formik.values.machine2} CP/CPK`);
    }

    // Write the workbook and trigger download
    XLSX.writeFile(wb, 'machine-comparison-report.xlsx');
  };

  // Removed: exportRawDataToPDF function

  // Handle Chart Click for Fullscreen
  const handleChartClick = (specLabel, machineLabel) => {
    setSelectedChartSpec(specLabel);
    setSelectedMachineForChart(machineLabel);
    setOpenChartModal(true);
  };

  return (
    <Container
      maxWidth="xl"
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
        Compare Machines
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

          {/* Machine 1 TextField */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="machine1"
              name="machine1"
              label="Machine 1"
              value={formik.values.machine1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              error={formik.touched.machine1 && Boolean(formik.errors.machine1)}
              helperText={formik.touched.machine1 && formik.errors.machine1}
            />
          </Grid>

          {/* Machine 2 TextField */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="machine2"
              name="machine2"
              label="Machine 2"
              value={formik.values.machine2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              error={formik.touched.machine2 && Boolean(formik.errors.machine2)}
              helperText={formik.touched.machine2 && formik.errors.machine2}
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

          {/* Compare Button */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Compare'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Display Error if any */}
      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {/* Display Success Message */}
      {!error && !loading && cpData1 && cpkData1 && cpData2 && cpkData2 && (
        <Alert severity="success" sx={{ mb: 4 }}>Comparison completed successfully!</Alert>
      )}

      {/* Results Section */}
      <div ref={resultRef}>
        {/* Summary Statistics */}
        {(Object.keys(summaryStats1).length > 0 || Object.keys(summaryStats2).length > 0) && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={4}>
              {/* Machine 1 Summary */}
              {Object.keys(summaryStats1).length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {formik.values.machine1}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table aria-label="summary statistics table machine1">
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
                        {Object.entries(summaryStats1).map(([spec, stats]) => (
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
                </Grid>
              )}

              {/* Machine 2 Summary */}
              {Object.keys(summaryStats2).length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {formik.values.machine2}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table aria-label="summary statistics table machine2">
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
                        {Object.entries(summaryStats2).map(([spec, stats]) => (
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
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* CP and CPK Values */}
        {(cpData1 && cpkData1) || (cpData2 && cpkData2) ? (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" gutterBottom>
              CP and CPK Values
            </Typography>
            <Grid container spacing={4}>
              {/* Machine 1 CP/CPK */}
              {cpData1 && cpkData1 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {formik.values.machine1}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table aria-label="cp cpk table machine1">
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
                                {cpData1[spec.label] !== 'N/A' ? cpData1[spec.label] : 'N/A'}
                              </TableCell>
                              <TableCell align="right">
                                {cpkData1[spec.label] !== 'N/A' ? cpkData1[spec.label] : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Machine 2 CP/CPK */}
              {cpData2 && cpkData2 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    {formik.values.machine2}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table aria-label="cp cpk table machine2">
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
                                {cpData2[spec.label] !== 'N/A' ? cpData2[spec.label] : 'N/A'}
                              </TableCell>
                              <TableCell align="right">
                                {cpkData2[spec.label] !== 'N/A' ? cpkData2[spec.label] : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : null}

        {/* Histograms */}
        {(Object.keys(histogramData1).length > 0 && Object.keys(histogramData2).length > 0) && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" gutterBottom>
              Measurement Distributions
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
                    {histogramData1[spec.label] && histogramData1[spec.label].labels?.length > 0 &&
                    histogramData2[spec.label] && histogramData2[spec.label].labels?.length > 0 ? (
                      <Grid container spacing={2}>
                        {/* Machine 1 Histogram */}
                        <Grid item xs={12} md={6}>
                          <Box
                            id={`chart1-${spec.label}`}
                            onClick={() => handleChartClick(spec.label, formik.values.machine1)}
                            sx={{ cursor: 'pointer', position: 'relative', height: 0, paddingBottom: '50%' }} // Responsive container
                          >
                            <Bar
                              ref={(el) => { chartRefs1.current[spec.label] = el; }}
                              data={histogramData1[spec.label]}
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
                        </Grid>

                        {/* Machine 2 Histogram */}
                        <Grid item xs={12} md={6}>
                          <Box
                            id={`chart2-${spec.label}`}
                            onClick={() => handleChartClick(spec.label, formik.values.machine2)}
                            sx={{ cursor: 'pointer', position: 'relative', height: 0, paddingBottom: '50%' }} // Responsive container
                          >
                            <Bar
                              ref={(el) => { chartRefs2.current[spec.label] = el; }}
                              data={histogramData2[spec.label]}
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
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2">
                        Not enough data to display histograms for both machines.
                      </Typography>
                    )}
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
      </div>

      {/* Export Buttons */}
      <Box sx={{ mb: 6, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" color="secondary" onClick={exportToPDF}>
          Export to PDF
        </Button>
        <Button variant="contained" color="primary" onClick={exportToExcel}>
          Export to Excel
        </Button>
        {/* 
        <Button
          variant="contained"
          color="success"
          onClick={exportRawDataToPDF}
          disabled={rawReports1.length === 0 && rawReports2.length === 0}
        >
          Export Raw Data to PDF
        </Button> 
        */}
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
              {selectedChartSpec} Distribution ({selectedMachineForChart})
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2, position: 'relative', height: '100%', width: '100%' }}>
          {selectedChartSpec && (
            <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
              {/* Determine which histogram data to use based on the selected machine */}
              {formik.values.machine1 === selectedMachineForChart && histogramData1[selectedChartSpec] && (
                <Bar
                  data={histogramData1[selectedChartSpec]}
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
              )}
              {formik.values.machine2 === selectedMachineForChart && histogramData2[selectedChartSpec] && (
                <Bar
                  data={histogramData2[selectedChartSpec]}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false, // Allows dynamic resizin
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
              )}
            </Box>
          )}
        </Box>
      </Dialog>
    </Container>
  );
}

export default CompareMachines;
