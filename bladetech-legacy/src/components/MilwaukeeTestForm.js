// src/components/MilwaukeeTestForm.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase'; // Adjust the import path as needed
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  Timestamp,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import NumericTextField from './NumericTextField'; // Ensure this path is correct

function MilwaukeeTestForm() {
  // Existing State Variables
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // State for latest revision
  const [latestRevision, setLatestRevision] = useState(null);
  const [latestSpecifications, setLatestSpecifications] = useState(null);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState('');

  // States for fetching products (SKU)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  // Fetching invoices where goodStatus is true
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesError, setInvoicesError] = useState('');

  // Fetching machines
  const [machines, setMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [machinesError, setMachinesError] = useState('');

  // Fetching operators
  const [operators, setOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorsError, setOperatorsError] = useState('');

  // Fetching measurement tools
  const [measurementTools, setMeasurementTools] = useState([]);
  const [loadingMeasurementTools, setLoadingMeasurementTools] = useState(true);
  const [measurementToolsError, setMeasurementToolsError] = useState('');

  // States for modals
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openCalibrationWarningModal, setOpenCalibrationWarningModal] =
    useState(false);
  const [formValuesToConfirm, setFormValuesToConfirm] = useState(null);
  const [calibrationWarnings, setCalibrationWarnings] = useState([]);
  const [selectedSubmittedBy, setSelectedSubmittedBy] = useState('');
  const [submittedByError, setSubmittedByError] = useState('');

  // State to disable form when calibration issues exist
  const [isFormDisabled, setIsFormDisabled] = useState(false);

  // New State Variables for Pallet Numbers
  const [palletNumbers, setPalletNumbers] = useState([]);
  const [loadingPalletNumbers, setLoadingPalletNumbers] = useState(false);
  const [palletNumbersError, setPalletNumbersError] = useState('');

  // New State Variables for withinSpec and Status
  const [withinSpecResults, setWithinSpecResults] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null); // true for pass, false for fail

  // Ref for Formik's setFieldValue to prevent ESLint warnings
  const setFieldValueRef = useRef(null);

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      sku: '',
      invoice: '',
      palletNumber: '',
      date: '',
      machine: '',
      sampleCount: '',
      height: '',
      bladeWidth: '',
      bladeBody: '',
      bladeBottom: '',
      toothSetLeft: '',
      toothSetLeft2: '',
      toothSetRight: '',
      toothSetRight2: '',
      gauge: '',
      dross: '',
      flatness: '',
      profileCheck: false, // Added profileCheck field
      operator: '',
      notes: '',
    },
    validationSchema: Yup.object({
      sku: Yup.string()
        .required('SKU is required')
        .matches(
          /^[A-Z0-9.]+$/,
          'SKU must be alphanumeric, uppercase, and can include periods'
        ),
      invoice: Yup.string().required('Invoice is required'),
      palletNumber: Yup.string().required('Pallet Number is required'),
      date: Yup.date().required('Date is required'),
      machine: Yup.string().required('Machine is required'),
      sampleCount: Yup.number()
        .required('Sample Count is required')
        .positive('Sample Count must be positive')
        .integer('Sample Count must be an integer'),
      height: Yup.string()
        .required('Height is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Height must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-height',
          'Height must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      bladeWidth: Yup.string()
        .required('Blade Width is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Blade Width must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-bladeWidth',
          'Blade Width must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      bladeBody: Yup.string()
        .required('Blade Body is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Blade Body must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-bladeBody',
          'Blade Body must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      bladeBottom: Yup.string()
        .required('Blade Bottom is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Blade Bottom must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-bladeBottom',
          'Blade Bottom must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      toothSetLeft: Yup.string()
        .required('Tooth Set Left Min is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Tooth Set Left Min must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-toothSetLeft',
          'Tooth Set Left Min must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      toothSetLeft2: Yup.string()
        .required('Tooth Set Left Max is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Tooth Set Left Max must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-toothSetLeft2',
          'Tooth Set Left Max must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      toothSetRight: Yup.string()
        .required('Tooth Set Right Min is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Tooth Set Right Min must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-toothSetRight',
          'Tooth Set Right Min must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      toothSetRight2: Yup.string()
        .required('Tooth Set Right Max is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Tooth Set Right Max must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-toothSetRight2',
          'Tooth Set Right Max must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      gauge: Yup.string()
        .required('Gauge is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Gauge must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-gauge',
          'Gauge must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      dross: Yup.string()
        .required('Dross is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Dross must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-dross',
          'Dross must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      flatness: Yup.string()
        .required('Flatness is required')
        .matches(
          /^\d+\.\d{4}$/,
          'Flatness must be a number with exactly four decimal places'
        )
        .test(
          'non-negative-flatness',
          'Flatness must be a non-negative number',
          function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return num >= 0;
          }
        ),
      profileCheck: Yup.boolean()
        .oneOf([true], 'Profile Check must be conducted')
        .required('Profile Check is required'),
      operator: Yup.string().required('Operator is required'),
      notes: Yup.string(),
    }),
    onSubmit: (values, { resetForm }) => {
      console.log('Form Submitted Values:', values);
      setFormValuesToConfirm(values);

      // Perform calibration date checks against current date
      const today = new Date();
      const warnings = measurementTools
        .filter((tool) => {
          if (!tool.needsCalibrationDate) {
            return true; // Treat null as needing immediate calibration
          }
          const needsDate = new Date(tool.needsCalibrationDate);
          return needsDate < today;
        })
        .map(
          (tool) =>
            `Measurement Tool "${tool.name}" (Serial: ${tool.serial}) needs calibration by ${new Date(
              tool.needsCalibrationDate
            ).toLocaleDateString()}.`
        );

      if (warnings.length > 0) {
        setCalibrationWarnings(warnings);
        setOpenCalibrationWarningModal(true);
      } else {
        // Calculate withinSpec and Status
        const { results, status } = calculateSpecStatus(values);
        setWithinSpecResults(results);
        setSubmissionStatus(status);

        setOpenConfirmModal(true);
      }
    },
  });

  // Assign Formik's setFieldValue to the ref
  useEffect(() => {
    setFieldValueRef.current = formik.setFieldValue;
  }, [formik.setFieldValue]);

  // Function to determine if a value is within spec
  const isWithinSpec = useCallback(
    (paramName) => {
      const value = formik.values[paramName];

      if (
        value === '' ||
        !latestSpecifications ||
        (!latestSpecifications[paramName] &&
          !(
            paramName === 'toothSetLeft' ||
            paramName === 'toothSetLeft2' ||
            paramName === 'toothSetRight' ||
            paramName === 'toothSetRight2'
          ))
      ) {
        // For tooth set parameters, use 'toothSet' spec
        if (
          (paramName === 'toothSetLeft' ||
            paramName === 'toothSetLeft2' ||
            paramName === 'toothSetRight' ||
            paramName === 'toothSetRight2') &&
          latestSpecifications &&
          latestSpecifications['toothSet']
        ) {
          // proceed to check with 'toothSet' spec
        } else {
          // Cannot determine
          return null;
        }
      }

      const spec =
        paramName === 'toothSetLeft' ||
        paramName === 'toothSetLeft2' ||
        paramName === 'toothSetRight' ||
        paramName === 'toothSetRight2'
          ? latestSpecifications['toothSet']
          : latestSpecifications[paramName];

      if (spec.min !== undefined && spec.max !== undefined) {
        if (paramName === 'toothSetLeft' || paramName === 'toothSetRight') {
          // Use average
          const value1 = parseFloat(formik.values[paramName]);
          const value2 = parseFloat(formik.values[`${paramName}2`]);
          if (isNaN(value1) || isNaN(value2)) {
            return null;
          }
          const average = (value1 + value2) / 2;
          return average >= spec.min && average <= spec.max;
        } else if (
          paramName === 'toothSetLeft2' ||
          paramName === 'toothSetRight2'
        ) {
          // For Max fields, check individually
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return null;
          }
          return numValue >= spec.min && numValue <= spec.max;
        } else {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return null;
          }
          return numValue >= spec.min && numValue <= spec.max;
        }
      } else if (spec.target !== undefined) {
        return value.trim().toLowerCase() === spec.target.trim().toLowerCase();
      } else {
        // Cannot determine
        return null;
      }
    },
    [latestSpecifications, formik.values]
  );

  // Function to calculate withinSpec and Status
  const calculateSpecStatus = (values) => {
    const results = {};
    const parameters = [
      'height',
      'bladeWidth',
      'bladeBody',
      'bladeBottom',
      'toothSetLeft',
      'toothSetLeft2',
      'toothSetRight',
      'toothSetRight2',
      'gauge',
      'dross',
      'flatness', // Added flatness
    ];

    parameters.forEach((param) => {
      const value = values[param];
      if (
        value === '' ||
        !latestSpecifications ||
        (!latestSpecifications[param] &&
          !(
            param === 'toothSetLeft' ||
            param === 'toothSetLeft2' ||
            param === 'toothSetRight' ||
            param === 'toothSetRight2'
          ))
      ) {
        // For tooth set parameters, use 'toothSet' spec
        if (
          (param === 'toothSetLeft' ||
            param === 'toothSetLeft2' ||
            param === 'toothSetRight' ||
            param === 'toothSetRight2') &&
          latestSpecifications &&
          latestSpecifications['toothSet']
        ) {
          // proceed to check with 'toothSet' spec
        } else {
          // Cannot determine
          results[param] = null;
          return;
        }
      }

      const spec =
        param === 'toothSetLeft' ||
        param === 'toothSetLeft2' ||
        param === 'toothSetRight' ||
        param === 'toothSetRight2'
          ? latestSpecifications['toothSet']
          : latestSpecifications[param];

      if (spec.min !== undefined && spec.max !== undefined) {
        if (param === 'toothSetLeft' || param === 'toothSetRight') {
          // Use average
          const value1 = parseFloat(values[param]);
          const value2 = parseFloat(values[`${param}2`]);
          if (isNaN(value1) || isNaN(value2)) {
            results[param] = null;
            return;
          }
          const average = (value1 + value2) / 2;
          results[param] = average >= spec.min && average <= spec.max;
        } else if (
          param === 'toothSetLeft2' ||
          param === 'toothSetRight2'
        ) {
          // For Max fields, check individually
          const numValue = parseFloat(values[param]);
          if (isNaN(numValue)) {
            results[param] = null;
          } else {
            results[param] = numValue >= spec.min && numValue <= spec.max;
          }
        } else {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            results[param] = null;
          } else {
            results[param] = numValue >= spec.min && numValue <= spec.max;
          }
        }
      } else if (spec.target !== undefined) {
        results[param] =
          value.trim().toLowerCase() === spec.target.trim().toLowerCase();
      } else {
        results[param] = null;
      }
    });

    // Determine overall status
    const allWithinSpec = parameters.every((param) => {
      const specResult = results[param];
      if (specResult === true) {
        return true;
      }
      return false;
    });

    // If any of the tooth set inputs fail, make the report as bad
    const toothSetParams = [
      'toothSetLeft',
      'toothSetLeft2',
      'toothSetRight',
      'toothSetRight2',
    ];
    const toothSetFailures = toothSetParams.some(
      (param) => results[param] === false || results[param] === null
    );
    const status = allWithinSpec && !toothSetFailures;

    return { results, status };
  };

  // Fetch latest revision and specifications when SKU changes
  useEffect(() => {
    const fetchLatestRevision = async () => {
      if (!formik.values.sku) {
        setLatestRevision(null);
        setLatestSpecifications(null);
        return;
      }
      setLoadingRevision(true);
      setRevisionError('');
      try {
        const revisionsCollection = collection(
          db,
          'products',
          formik.values.sku,
          'revisions'
        );
        const revisionsQueryInstance = query(
          revisionsCollection,
          orderBy('createdAt', 'desc')
        );
        const revisionsSnapshot = await getDocs(revisionsQueryInstance);

        if (revisionsSnapshot.empty) {
          setLatestRevision(null);
          setLatestSpecifications(null);
          setRevisionError('No revisions found for this SKU.');
          return;
        }

        const latestRevisionDoc = revisionsSnapshot.docs[0];
        setLatestRevision(latestRevisionDoc.id);

        // Fetch specifications from the latest revision
        const revisionData = latestRevisionDoc.data();
        if (revisionData.specifications) {
          setLatestSpecifications(revisionData.specifications);
        } else {
          setLatestSpecifications(null);
          setRevisionError('No specifications found in the latest revision.');
        }
      } catch (err) {
        console.error('Error fetching latest revision:', err);
        setRevisionError('Failed to load latest revision. Please try again.');
        setLatestRevision(null);
        setLatestSpecifications(null);
      } finally {
        setLoadingRevision(false);
      }
    };

    fetchLatestRevision();
  }, [formik.values.sku]);

  // Fetching invoices from Firestore where goodStatus is true
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      setInvoicesError('');
      try {
        const invoicesCollection = collection(db, 'Goodsin');
        const invoicesQueryInstance = query(
          invoicesCollection,
          where('goodStatus', '==', true)
        );
        const invoicesSnapshot = await getDocs(invoicesQueryInstance);

        // Extract invoice numbers and filter out any falsy values
        const allInvoiceNumbers = invoicesSnapshot.docs
          .map((doc) => doc.data().invoice)
          .filter((inv) => inv);

        // Remove duplicates
        const uniqueInvoiceNumbers = Array.from(new Set(allInvoiceNumbers));

        // Map to array of objects
        const uniqueInvoicesList = uniqueInvoiceNumbers.map((inv) => ({
          invoiceNumber: inv,
        }));

        setInvoices(uniqueInvoicesList);
        // Reset the invoice field when invoices are fetched
        setFieldValueRef.current('invoice', '');
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setInvoicesError('Failed to load invoices. Please try again.');
        setInvoices([]);
        setFieldValueRef.current('invoice', '');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, []); // Fetch on component mount

  // Fetch pallet numbers based on selected invoice
  useEffect(() => {
    const fetchPalletNumbers = async () => {
      const selectedInvoice = formik.values.invoice;
      if (!selectedInvoice) {
        setPalletNumbers([]);
        return;
      }

      setLoadingPalletNumbers(true);
      setPalletNumbersError('');

      try {
        const goodsinCollection = collection(db, 'Goodsin');
        const palletQueryInstance = query(
          goodsinCollection,
          where('invoice', '==', selectedInvoice),
          where('goodStatus', '==', true)
        );

        const palletSnapshot = await getDocs(palletQueryInstance);
        const palletList = palletSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            palletNumber: doc.data().palletNumber || '',
          }))
          .filter((pallet) => pallet.palletNumber !== '');

        // Remove duplicates
        const uniquePalletNumbers = Array.from(
          new Set(palletList.map((p) => p.palletNumber))
        );

        // Map unique pallet numbers to objects
        const uniquePallets = uniquePalletNumbers.map((palletNumber) => ({
          palletNumber,
        }));

        setPalletNumbers(uniquePallets);
        // Reset the pallet number field when pallets are fetched
        setFieldValueRef.current('palletNumber', '');
      } catch (err) {
        console.error('Error fetching pallet numbers:', err);
        setPalletNumbersError('Failed to load pallet numbers. Please try again.');
        setPalletNumbers([]);
        setFieldValueRef.current('palletNumber', '');
      } finally {
        setLoadingPalletNumbers(false);
      }
    };

    fetchPalletNumbers();
  }, [formik.values.invoice]); // Fetch when invoice changes

  // Fetch products from Firestore on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setProductsError('');
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID as SKU
          name: doc.data().name || '', // Assuming 'name' field exists
        }));
        setProducts(productsList);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProductsError('Failed to load products. Please try again.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch machines from Firestore on component mount
  useEffect(() => {
    const fetchMachines = async () => {
      setLoadingMachines(true);
      setMachinesError('');
      try {
        const machinesCollection = collection(db, 'Machines');
        const machinesSnapshot = await getDocs(machinesCollection);
        const machinesList = machinesSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID
          name: doc.data().name || '', // Fetch 'name' field
        }));
        setMachines(machinesList);
      } catch (err) {
        console.error('Error fetching machines:', err);
        setMachinesError('Failed to load machines. Please try again.');
      } finally {
        setLoadingMachines(false);
      }
    };

    fetchMachines();
  }, []);

  // Fetch operators from Firestore on component mount
  useEffect(() => {
    const fetchOperators = async () => {
      setLoadingOperators(true);
      setOperatorsError('');
      try {
        const operatorsCollection = collection(db, 'Operators');
        const operatorsSnapshot = await getDocs(operatorsCollection);
        const operatorsList = operatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '', // Assuming 'name' field exists
        }));
        setOperators(operatorsList);
      } catch (err) {
        console.error('Error fetching operators:', err);
        setOperatorsError('Failed to load operators. Please try again.');
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, []);

  // Fetch measurement tools from Firestore on component mount
  useEffect(() => {
    const fetchMeasurementTools = async () => {
      setLoadingMeasurementTools(true);
      setMeasurementToolsError('');
      try {
        const measurementToolsCollection = collection(db, 'MeasurementTools');
        const measurementToolsSnapshot = await getDocs(
          measurementToolsCollection
        );
        const toolsList = measurementToolsSnapshot.docs.map((doc) => {
          const data = doc.data();
          const lastCalibrationTimestamp = data.lastCalibrationDate;
          const lastCalibrationDate = lastCalibrationTimestamp
            ? lastCalibrationTimestamp.toDate()
            : null;
          let needsCalibrationDate = null;

          if (lastCalibrationDate) {
            const needsDate = new Date(lastCalibrationDate);
            needsDate.setMonth(needsDate.getMonth() + 3);
            needsCalibrationDate = needsDate.toISOString();
          }

          return {
            id: doc.id,
            name: data.name || doc.id,
            serial: data.serial || 'N/A',
            lastCalibrationDate: lastCalibrationDate
              ? lastCalibrationDate.toLocaleDateString()
              : 'N/A',
            needsCalibrationDate,
            latestCalibrationResults: data.latestCalibrationResults || 'N/A',
          };
        });
        setMeasurementTools(toolsList);

        // After fetching, perform calibration check
        performCalibrationCheck(toolsList);
      } catch (err) {
        console.error('Error fetching measurement tools:', err);
        setMeasurementToolsError(
          'Failed to load measurement tools. Please try again.'
        );
      } finally {
        setLoadingMeasurementTools(false);
      }
    };

    fetchMeasurementTools();
  }, []);

  // Function to perform calibration check upon data load
  const performCalibrationCheck = (toolsList) => {
    const today = new Date();
    const warnings = toolsList
      .filter((tool) => {
        if (!tool.needsCalibrationDate) {
          return true; // Treat null as needing immediate calibration
        }
        const needsDate = new Date(tool.needsCalibrationDate);
        return needsDate < today;
      })
      .map(
        (tool) =>
          `Measurement Tool "${tool.name}" (Serial: ${tool.serial}) needs calibration by ${new Date(
            tool.needsCalibrationDate
          ).toLocaleDateString()}.`
      );

    if (warnings.length > 0) {
      setCalibrationWarnings(warnings);
      setOpenCalibrationWarningModal(true);
      setIsFormDisabled(true); // Disable the form
    } else {
      setCalibrationWarnings([]);
      setIsFormDisabled(false); // Enable the form
    }
  };

  // Fetch the last sample count from Machines collection when machine is selected
  useEffect(() => {
    const fetchLastSampleCount = async () => {
      if (!formik.values.machine) {
        return;
      }
      try {
        const machineDocRef = doc(db, 'Machines', formik.values.machine);
        const machineDocSnap = await getDoc(machineDocRef);

        if (machineDocSnap.exists()) {
          const machineData = machineDocSnap.data();
          const lastCount = parseInt(machineData.lastcount, 10) || 0;

          // Update the sampleCount field in the form
          setFieldValueRef.current('sampleCount', lastCount);
        } else {
          // If machine document does not exist or no lastcount, set sampleCount to 0
          setFieldValueRef.current('sampleCount', 0);
        }
      } catch (err) {
        console.error('Error fetching last sample count from Machines:', err);
        // Handle error, set sampleCount to 0
        setFieldValueRef.current('sampleCount', 0);
      }
    };

    fetchLastSampleCount();
  }, [formik.values.machine]);

  // Retrieve operator name for display in modal
  const assignedOperator = formValuesToConfirm
    ? operators.find((op) => op.id === formValuesToConfirm.operator)
    : null;

  // Function to handle confirming the submission
  const handleConfirmSubmit = async () => {
    // Validate that 'Submitted By' is selected
    if (!selectedSubmittedBy) {
      setSubmittedByError('Please select a "Submitted By" option.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setOpenConfirmModal(false);

    try {
      // Convert the date string to a JavaScript Date object
      const dateObject = new Date(formValuesToConfirm.date);
      // Convert the Date object to a Firestore Timestamp
      const timestamp = Timestamp.fromDate(dateObject);

      // Prepare the data to be saved
      const newReport = {
        sku: formValuesToConfirm.sku, // SKU
        revision: latestRevision || null, // Latest revision
        invoice: formValuesToConfirm.invoice, // Invoice
        palletNumber: formValuesToConfirm.palletNumber, // Pallet Number
        date: timestamp, // Date stored as Firestore Timestamp
        machine: formValuesToConfirm.machine, // Selected machine ID
        sampleCount: parseInt(formValuesToConfirm.sampleCount, 10),
        height:
          formValuesToConfirm.height !== ''
            ? parseFloat(formValuesToConfirm.height) || null
            : null,
        bladeWidth:
          formValuesToConfirm.bladeWidth !== ''
            ? parseFloat(formValuesToConfirm.bladeWidth) || null
            : null,
        bladeBody:
          formValuesToConfirm.bladeBody !== ''
            ? parseFloat(formValuesToConfirm.bladeBody) || null
            : null,
        bladeBottom:
          formValuesToConfirm.bladeBottom !== ''
            ? parseFloat(formValuesToConfirm.bladeBottom) || null
            : null,
        toothSetLeft:
          formValuesToConfirm.toothSetLeft !== '' &&
          formValuesToConfirm.toothSetLeft2 !== ''
            ? parseFloat(
                (
                  (parseFloat(formValuesToConfirm.toothSetLeft) +
                    parseFloat(formValuesToConfirm.toothSetLeft2)) /
                  2
                ).toFixed(5)
              )
            : null,
        toothSetRight:
          formValuesToConfirm.toothSetRight !== '' &&
          formValuesToConfirm.toothSetRight2 !== ''
            ? parseFloat(
                (
                  (parseFloat(formValuesToConfirm.toothSetRight) +
                    parseFloat(formValuesToConfirm.toothSetRight2)) /
                  2
                ).toFixed(5)
              )
            : null,
        gauge:
          formValuesToConfirm.gauge !== ''
            ? parseFloat(formValuesToConfirm.gauge) || null
            : null,
        dross:
          formValuesToConfirm.dross !== ''
            ? parseFloat(formValuesToConfirm.dross)
            : null,
        flatness:
          formValuesToConfirm.flatness !== ''
            ? parseFloat(formValuesToConfirm.flatness) || null
            : null,
        profileCheck: formValuesToConfirm.profileCheck, // Include profileCheck
        operator: formValuesToConfirm.operator, // Existing field
        submittedBy: selectedSubmittedBy, // Selected in modal
        createdAt: Timestamp.now(), // Add creation timestamp
        withinSpec: withinSpecResults, // Use pre-calculated withinSpec
        notes: formValuesToConfirm.notes || '', // Added 'notes' field
        Status: submissionStatus, // Add Status field
      };

      console.log('New Report to Save:', newReport);
      console.log('Latest Specifications:', latestSpecifications);

      // Save the test report to a central collection with revision info
      await addDoc(collection(db, 'milwaukeeTestReports'), newReport);

      // Update the lastcount field in Machines collection
      const machineDocRef = doc(db, 'Machines', formValuesToConfirm.machine);
      await updateDoc(machineDocRef, {
        lastcount: parseInt(formValuesToConfirm.sampleCount, 10),
      });

      setSuccessMessage('Test report added successfully!');
      formik.resetForm();
      setSelectedSubmittedBy(''); // Reset 'Submitted By' selection
      setFormValuesToConfirm(null); // Reset form values to confirm
      setWithinSpecResults({});
      setSubmissionStatus(null);
    } catch (err) {
      console.error('Error adding test report:', err);
      setError('Failed to add test report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle canceling the submission
  const handleCancelSubmit = () => {
    setOpenConfirmModal(false);
    setFormValuesToConfirm(null);
    setSelectedSubmittedBy('');
    setSubmittedByError('');
  };

  // Extract Min and Max Values for Modal Display
  const toothSetLeftMin = formValuesToConfirm?.toothSetLeft || 'N/A';
  const toothSetLeftMax = formValuesToConfirm?.toothSetLeft2 || 'N/A';
  const toothSetRightMin = formValuesToConfirm?.toothSetRight || 'N/A';
  const toothSetRightMax = formValuesToConfirm?.toothSetRight2 || 'N/A';
  const flatness = formValuesToConfirm?.flatness || 'N/A';
  const profileCheckStatus = formValuesToConfirm?.profileCheck ? 'Yes' : 'No';

  // Calculate averages for modal display with 5 decimal points
  const averageToothSetLeft =
    formValuesToConfirm &&
    formValuesToConfirm.toothSetLeft &&
    formValuesToConfirm.toothSetLeft2
      ? (
          (parseFloat(formValuesToConfirm.toothSetLeft) +
            parseFloat(formValuesToConfirm.toothSetLeft2)) /
          2
        ).toFixed(5)
      : 'N/A';

  const averageToothSetRight =
    formValuesToConfirm &&
    formValuesToConfirm.toothSetRight &&
    formValuesToConfirm.toothSetRight2
      ? (
          (parseFloat(formValuesToConfirm.toothSetRight) +
            parseFloat(formValuesToConfirm.toothSetRight2)) /
          2
        ).toFixed(5)
      : 'N/A';

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 4,
        mb: 4,
        p: { xs: 2, sm: 3 },
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 3,
        mx: 'auto',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'center',
          mb: 2,
          color: '#333',
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        Add Test Report
      </Typography>

      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        sx={{ mt: 2 }}
      >
        <Grid container spacing={2}>
          {/* SKU */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.sku && Boolean(formik.errors.sku)}
              disabled={isFormDisabled}
            >
              <InputLabel id="sku-label">SKU</InputLabel>
              <Select
                labelId="sku-label"
                id="sku"
                name="sku"
                value={formik.values.sku}
                label="SKU"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={
                  loadingProducts || Boolean(productsError) || isFormDisabled
                }
              >
                {loadingProducts ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {`${product.id} - ${product.name}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No products available</em>
                  </MenuItem>
                )}
              </Select>
              {loadingProducts && (
                <FormHelperText>Loading products...</FormHelperText>
              )}
              {formik.touched.sku && formik.errors.sku && (
                <FormHelperText>{formik.errors.sku}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Invoice */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.invoice && Boolean(formik.errors.invoice)}
              disabled={
                loadingInvoices || Boolean(invoicesError) || isFormDisabled
              }
            >
              <InputLabel id="invoice-label">Invoice</InputLabel>
              <Select
                labelId="invoice-label"
                id="invoice"
                name="invoice"
                value={formik.values.invoice}
                label="Invoice"
                onChange={(e) => {
                  formik.handleChange(e);
                  // Reset pallet number when invoice changes
                  setFieldValueRef.current('palletNumber', '');
                }}
                onBlur={formik.handleBlur}
              >
                {loadingInvoices ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <MenuItem
                      key={invoice.invoiceNumber}
                      value={invoice.invoiceNumber}
                    >
                      {invoice.invoiceNumber}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No available invoices with status "Good"</em>
                  </MenuItem>
                )}
              </Select>
              {loadingInvoices && (
                <FormHelperText>Loading invoices...</FormHelperText>
              )}
              {formik.touched.invoice && formik.errors.invoice && (
                <FormHelperText>{formik.errors.invoice}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Pallet Number */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={
                formik.touched.palletNumber &&
                Boolean(formik.errors.palletNumber)
              }
              disabled={
                loadingPalletNumbers ||
                Boolean(palletNumbersError) ||
                isFormDisabled ||
                !formik.values.invoice
              }
            >
              <InputLabel id="pallet-number-label">Pallet Number</InputLabel>
              <Select
                labelId="pallet-number-label"
                id="palletNumber"
                name="palletNumber"
                value={formik.values.palletNumber}
                label="Pallet Number"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {loadingPalletNumbers ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : palletNumbers.length > 0 ? (
                  palletNumbers.map((pallet) => (
                    <MenuItem
                      key={pallet.palletNumber}
                      value={pallet.palletNumber}
                    >
                      {pallet.palletNumber}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>
                      {formik.values.invoice
                        ? 'No pallet numbers available for this invoice'
                        : 'Please select an invoice first'}
                    </em>
                  </MenuItem>
                )}
              </Select>
              {loadingPalletNumbers && (
                <FormHelperText>Loading pallet numbers...</FormHelperText>
              )}
              {formik.touched.palletNumber && formik.errors.palletNumber && (
                <FormHelperText>{formik.errors.palletNumber}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              disabled={isFormDisabled}
            />
          </Grid>

          {/* Latest Revision Display */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Latest Revision"
              name="latestRevision"
              value={
                loadingRevision
                  ? 'Loading...'
                  : latestRevision || 'No revision available'
              }
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              error={Boolean(revisionError)}
              helperText={revisionError}
              disabled={isFormDisabled}
            />
          </Grid>

          {/* Machine (Dropdown) */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.machine && Boolean(formik.errors.machine)}
              disabled={isFormDisabled}
            >
              <InputLabel id="machine-label">Machine</InputLabel>
              <Select
                labelId="machine-label"
                id="machine"
                name="machine"
                value={formik.values.machine}
                label="Machine"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={
                  loadingMachines || Boolean(machinesError) || isFormDisabled
                }
              >
                {loadingMachines ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : machines.length > 0 ? (
                  machines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {`${machine.id} - ${machine.name}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No machines available</em>
                  </MenuItem>
                )}
              </Select>
              {loadingMachines && (
                <FormHelperText>Loading machines...</FormHelperText>
              )}
              {formik.touched.machine && formik.errors.machine && (
                <FormHelperText>{formik.errors.machine}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Operator (Dropdown) */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.operator && Boolean(formik.errors.operator)}
              disabled={isFormDisabled}
            >
              <InputLabel id="operator-label">Operator</InputLabel>
              <Select
                labelId="operator-label"
                id="operator"
                name="operator"
                value={formik.values.operator}
                label="Operator"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={
                  loadingOperators || Boolean(operatorsError) || isFormDisabled
                }
              >
                {loadingOperators ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : operators.length > 0 ? (
                  operators.map((operator) => (
                    <MenuItem key={operator.id} value={operator.id}>
                      {`${operator.id} - ${operator.name}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No operators available</em>
                  </MenuItem>
                )}
              </Select>
              {loadingOperators && (
                <FormHelperText>Loading operators...</FormHelperText>
              )}
              {formik.touched.operator && formik.errors.operator && (
                <FormHelperText>{formik.errors.operator}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Sample Count */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Sample Count"
              name="sampleCount"
              type="number"
              value={formik.values.sampleCount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={
                formik.touched.sampleCount && Boolean(formik.errors.sampleCount)
              }
              helperText={
                formik.touched.sampleCount && formik.errors.sampleCount
              }
              inputProps={{
                min: 1,
              }}
              disabled={isFormDisabled}
            />
          </Grid>

          {/* Numeric Fields with Enhanced Color Coding */}
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Height"
              name="height"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Blade Width"
              name="bladeWidth"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Blade Body"
              name="bladeBody"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Blade Bottom"
              name="bladeBottom"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          {/* Tooth Set Left Min and Max */}
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Tooth Set Left Min"
              name="toothSetLeft"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Tooth Set Left Max"
              name="toothSetLeft2"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          {/* Tooth Set Right Min and Max */}
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Tooth Set Right Min"
              name="toothSetRight"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Tooth Set Right Max"
              name="toothSetRight2"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Gauge"
              name="gauge"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Dross"
              name="dross"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>
          {/* Flatness Field */}
          <Grid item xs={12} sm={6}>
            <NumericTextField
              label="Flatness"
              name="flatness"
              formik={formik}
              isWithinSpec={isWithinSpec}
              isFormDisabled={isFormDisabled}
            />
          </Grid>

          {/* Profile Check */}
          <Grid item xs={12} sm={6}>
            <FormControl
              component="fieldset"
              error={
                formik.touched.profileCheck && Boolean(formik.errors.profileCheck)
              }
              disabled={isFormDisabled}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.profileCheck}
                    onChange={(event) => {
                      formik.setFieldValue('profileCheck', event.target.checked);
                    }}
                    name="profileCheck"
                    color="primary"
                    disabled={isFormDisabled}
                  />
                }
                label="Profile Check Conducted"
              />
              {formik.touched.profileCheck && formik.errors.profileCheck && (
                <FormHelperText>{formik.errors.profileCheck}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Notes"
              name="notes"
              value={formik.values.notes}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              multiline
              rows={4}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={formik.touched.notes && formik.errors.notes}
              disabled={isFormDisabled}
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={
                loading ||
                loadingProducts ||
                loadingMachines ||
                loadingOperators ||
                loadingRevision ||
                loadingMeasurementTools ||
                loadingInvoices ||
                loadingPalletNumbers ||
                Boolean(productsError) ||
                Boolean(machinesError) ||
                Boolean(operatorsError) ||
                Boolean(revisionError) ||
                Boolean(measurementToolsError) ||
                Boolean(invoicesError) ||
                Boolean(palletNumbersError) ||
                isFormDisabled
              }
              sx={{
                py: 1.5,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                backgroundColor: '#4eb857',
                '&:hover': {
                  backgroundColor: '#3da34a',
                },
                '&:disabled': {
                  backgroundColor: '#cccccc',
                  cursor: 'not-allowed',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Add Test Report'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Confirmation Modal */}
      <Dialog
        open={openConfirmModal}
        onClose={handleCancelSubmit}
        aria-labelledby="confirm-submit-title"
        aria-describedby="confirm-submit-description"
      >
        <DialogTitle id="confirm-submit-title">Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-submit-description">
            Please confirm the following details before submitting:
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="body1">
              <strong>Operator:</strong>{' '}
              {assignedOperator
                ? `${assignedOperator.id} - ${assignedOperator.name}`
                : formValuesToConfirm?.operator}
            </Typography>
            <Typography variant="body1">
              <strong>Revision:</strong>{' '}
              {latestRevision || 'No revision available'}
            </Typography>
            {/* Invoice Display */}
            {formValuesToConfirm?.invoice && (
              <Typography variant="body1">
                <strong>Invoice:</strong> {formValuesToConfirm?.invoice || 'N/A'}
              </Typography>
            )}
            {/* Pallet Number Display */}
            {formValuesToConfirm?.palletNumber && (
              <Typography variant="body1">
                <strong>Pallet Number:</strong>{' '}
                {formValuesToConfirm?.palletNumber || 'N/A'}
              </Typography>
            )}
            {/* Date Display */}
            {formValuesToConfirm?.date && (
              <Typography variant="body1">
                <strong>Date:</strong>{' '}
                {new Date(formValuesToConfirm.date).toLocaleDateString() ||
                  'N/A'}
              </Typography>
            )}
            {/* Display Tooth Set Min, Max, and Average Values */}
            <Typography variant="body1">
              <strong>Tooth Set Left Min:</strong> {toothSetLeftMin}
            </Typography>
            <Typography variant="body1">
              <strong>Tooth Set Left Max:</strong> {toothSetLeftMax}
            </Typography>
            <Typography variant="body1">
              <strong>Tooth Set Left Average:</strong> {averageToothSetLeft}
            </Typography>
            <Typography variant="body1">
              <strong>Tooth Set Right Min:</strong> {toothSetRightMin}
            </Typography>
            <Typography variant="body1">
              <strong>Tooth Set Right Max:</strong> {toothSetRightMax}
            </Typography>
            <Typography variant="body1">
              <strong>Tooth Set Right Average:</strong> {averageToothSetRight}
            </Typography>
            {/* Flatness Display */}
            {formValuesToConfirm?.flatness && (
              <Typography variant="body1">
                <strong>Flatness:</strong> {flatness}
              </Typography>
            )}
            {/* Profile Check Display */}
            {formValuesToConfirm && (
              <Typography variant="body1">
                <strong>Profile Check Conducted:</strong> {profileCheckStatus}
              </Typography>
            )}
            {/* Status Display */}
            {submissionStatus !== null && (
              <Box display="flex" alignItems="center" mt={2}>
                {submissionStatus ? (
                  <CheckCircle sx={{ color: 'green', mr: 1 }} />
                ) : (
                  <Cancel sx={{ color: 'red', mr: 1 }} />
                )}
                <Typography
                  variant="body1"
                  sx={{
                    color: submissionStatus ? 'green' : 'red',
                    fontWeight: 'bold',
                  }}
                >
                  <strong>Status:</strong> {submissionStatus ? 'Pass' : 'Fail'}
                </Typography>
              </Box>
            )}
            {/* Quarantine Message if Fail */}
            {submissionStatus === false && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Quarantine the last 500 for retesting.
              </Alert>
            )}
            {/* Submitted By Dropdown */}
            <FormControl
              fullWidth
              required
              error={Boolean(submittedByError)}
              sx={{ mt: 2 }}
            >
              <InputLabel id="submitted-by-label">Submitted By</InputLabel>
              <Select
                labelId="submitted-by-label"
                id="submittedBy"
                name="submittedBy"
                value={selectedSubmittedBy}
                label="Submitted By"
                onChange={(e) => {
                  setSelectedSubmittedBy(e.target.value);
                  if (e.target.value) {
                    setSubmittedByError('');
                  }
                }}
              >
                {loadingOperators ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : operators.length > 0 ? (
                  operators.map((operator) => (
                    <MenuItem key={operator.id} value={operator.id}>
                      {`${operator.id} - ${operator.name}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No operators available</em>
                  </MenuItem>
                )}
              </Select>
              {submittedByError && (
                <FormHelperText>{submittedByError}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmit} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            color="primary"
            autoFocus
            disabled={!selectedSubmittedBy || loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calibration Warning Modal */}
      <Dialog
        open={openCalibrationWarningModal}
        onClose={() => setOpenCalibrationWarningModal(false)}
        aria-labelledby="calibration-warning-title"
        aria-describedby="calibration-warning-description"
      >
        <DialogTitle id="calibration-warning-title">
          Calibration Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="calibration-warning-description">
            The following measurement tools are out of calibration and need to be
            calibrated before submitting a test report:
          </DialogContentText>
          <Box mt={2}>
            <Alert severity="warning">
              <ul>
                {calibrationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              Please calibrate the listed measurement tools before proceeding.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCalibrationWarningModal(false)}
            color="primary"
            autoFocus
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 4 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}

      {/* Products Fetch Error */}
      {productsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {productsError}
        </Alert>
      )}

      {/* Machines Fetch Error */}
      {machinesError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {machinesError}
        </Alert>
      )}

      {/* Operators Fetch Error */}
      {operatorsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {operatorsError}
        </Alert>
      )}

      {/* Revision Fetch Error */}
      {revisionError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {revisionError}
        </Alert>
      )}

      {/* Invoices Fetch Error */}
      {invoicesError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {invoicesError}
        </Alert>
      )}

      {/* Pallet Numbers  Fetch Error */}
      {palletNumbersError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {palletNumbersError}
        </Alert>
      )}

      {/* Measurement Tools Fetch Error */}
      {measurementToolsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {measurementToolsError}
        </Alert>
      )}
    </Container>
  );
}

export default MilwaukeeTestForm;
