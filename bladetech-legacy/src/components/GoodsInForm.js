// src/components/GoodsInForm.js

import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert, // Ensure Alert is imported
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
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  Timestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore';

function GoodsInForm() {
  // State variables for form submission feedback
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // State variables for suppliers and SKUs data
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [suppliersError, setSuppliersError] = useState('');

  const [skus, setSkus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [skusError, setSkusError] = useState('');

  // State for specifications fetched based on SKU
  const [specifications, setSpecifications] = useState(null);
  const [loadingSpecifications, setLoadingSpecifications] = useState(false);
  const [specificationsError, setSpecificationsError] = useState('');

  // State for confirmation modal
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [formValuesToConfirm, setFormValuesToConfirm] = useState(null);

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      sku: '',
      palletNumber: '',
      supplier: '',
      invoice: '',
      notes: '',
      height: '',
      gauge: '',
      setLeft1: '',
      setLeft2: '',
      setRight1: '',
      setRight2: '',
    },
    validationSchema: Yup.object({
      sku: Yup.string().required('SKU is required'),
      palletNumber: Yup.number()
        .required('Pallet Number is required')
        .positive('Pallet Number must be positive')
        .integer('Pallet Number must be an integer'),
      supplier: Yup.string().required('Supplier is required'),
      invoice: Yup.string()
        .required('Invoice is required')
        .matches(/^\d{6}$/, 'Invoice must be 6 digits.'),
      notes: Yup.string().optional(),
      height: Yup.number()
        .required('Height is required')
        .positive('Height must be positive'),
      gauge: Yup.number()
        .required('Gauge is required')
        .positive('Gauge must be positive'),
      setLeft1: Yup.number()
        .min(0, 'Set Left 1 cannot be negative')
        .required('Set Left 1 is required'),
      setLeft2: Yup.number()
        .min(0, 'Set Left 2 cannot be negative')
        .required('Set Left 2 is required'),
      setRight1: Yup.number()
        .min(0, 'Set Right 1 cannot be negative')
        .required('Set Right 1 is required'),
      setRight2: Yup.number()
        .min(0, 'Set Right 2 cannot be negative')
        .required('Set Right 2 is required'),
    }),
    onSubmit: (values) => {
      const isBad = checkOutOfSpec(values);
      const goodStatus = !isBad; // true if good, false if bad
      setFormValuesToConfirm({ ...values, goodStatus });
      setOpenConfirmModal(true);
    },
  });

  // Function to map input fields to specification keys
  const getSpecKey = (fieldName) => {
    const mapping = {
      setLeft1: 'setLeft',
      setLeft2: 'setLeft',
      setRight1: 'setRight',
      setRight2: 'setRight',
      // Add more mappings if necessary
    };
    return mapping[fieldName] || fieldName;
  };

  // Fetch suppliers and SKUs on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const suppliersCollection = collection(db, 'Supplier');
        const suppliersSnapshot = await getDocs(suppliersCollection);
        const suppliersList = suppliersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
        }));
        setSuppliers(suppliersList);
      } catch (err) {
        setSuppliersError('Failed to load suppliers. Please try again.');
      } finally {
        setLoadingSuppliers(false);
      }
    };

    const fetchSkus = async () => {
      setLoadingSkus(true);
      try {
        const approvedDrawingsCollection = collection(
          db,
          'APPROVED RAW MATERIAL DRAWINGS'
        );
        const skusSnapshot = await getDocs(approvedDrawingsCollection);
        const skusList = skusSnapshot.docs.map((doc) => ({
          id: doc.id,
          metCode: doc.data().metCode || '',
          description: doc.data().description || '',
        }));
        setSkus(skusList);
      } catch (err) {
        setSkusError('Failed to load SKUs. Please try again.');
      } finally {
        setLoadingSkus(false);
      }
    };

    fetchSuppliers();
    fetchSkus();
  }, []);

  // Fetch specifications when SKU changes
  useEffect(() => {
    async function fetchSpecifications() {
      setSpecifications(null);
      setLoadingSpecifications(true);
      setSpecificationsError('');
      if (!formik.values.sku) {
        setLoadingSpecifications(false);
        return;
      }
      try {
        const rawMaterialRef = doc(db, 'Raw Material', formik.values.sku);
        const rawMaterialSnap = await getDoc(rawMaterialRef);
        if (!rawMaterialSnap.exists()) {
          setSpecificationsError('No specifications found for this SKU.');
          setLoadingSpecifications(false);
          return;
        }
        const revisionsRef = collection(rawMaterialRef, 'revisions');
        const revisionsSnapshot = await getDocs(revisionsRef);
        if (revisionsSnapshot.empty) {
          setSpecificationsError('No specifications found for this SKU.');
          setLoadingSpecifications(false);
          return;
        }
        // Get the latest revision (assuming the latest revision has the latest date)
        const revisions = revisionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
        revisions.sort((a, b) => b.data.date - a.data.date);
        const latestRevision = revisions[0];
        const specs = latestRevision.data.specifications;
        setSpecifications(specs);
        setLoadingSpecifications(false);
      } catch (err) {
        console.error('Error fetching specifications: ', err);
        setSpecificationsError('Failed to fetch specifications.');
        setLoadingSpecifications(false);
      }
    }
    fetchSpecifications();
  }, [formik.values.sku]);

  // Function to check if a measurement is within spec
  const isWithinSpec = (fieldName) => {
    if (!specifications || !formik.values[fieldName]) return null;
    const value = parseFloat(formik.values[fieldName]);
    const specKey = getSpecKey(fieldName);
    const spec = specifications[specKey];
    if (spec && spec.min !== null && spec.max !== null && !isNaN(value)) {
      if (value < spec.min || value > spec.max) {
        return false;
      } else {
        return true;
      }
    }
    return null;
  };

  // Function to calculate average
  const calculateAverage = (val1, val2) => {
    if (val1 === '' || val2 === '') return null;
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    if (isNaN(num1) || isNaN(num2)) return null;
    return ((num1 + num2) / 2).toFixed(2);
  };

  // Function to check if any measurement is out of spec
  const checkOutOfSpec = (values) => {
    if (!specifications) return false;
    let outOfSpec = false;
    ['height', 'gauge', 'setLeft1', 'setLeft2', 'setRight1', 'setRight2'].forEach((key) => {
      const specKey = getSpecKey(key);
      const spec = specifications[specKey];
      const value = parseFloat(values[key]);
      if (spec && spec.min !== null && spec.max !== null && !isNaN(value)) {
        if (value < spec.min || value > spec.max) {
          outOfSpec = true;
        }
      }
    });
    return outOfSpec;
  };

  // Handle form submission confirmation
  const handleConfirmSubmit = async () => {
    setLoading(true);
    setOpenConfirmModal(false);

    try {
      const timestamp = Timestamp.now();

      // Calculate averages
      const setLeftAvg =
        (parseFloat(formValuesToConfirm.setLeft1) +
          parseFloat(formValuesToConfirm.setLeft2)) /
        2;
      const setRightAvg =
        (parseFloat(formValuesToConfirm.setRight1) +
          parseFloat(formValuesToConfirm.setRight2)) /
        2;

      // Prepare data to send to Firestore
      const newGoodsIn = {
        sku: formValuesToConfirm.sku,
        palletNumber: parseInt(formValuesToConfirm.palletNumber, 10),
        supplier: formValuesToConfirm.supplier,
        invoice: formValuesToConfirm.invoice,
        notes: formValuesToConfirm.notes,
        height: parseFloat(formValuesToConfirm.height),
        gauge: parseFloat(formValuesToConfirm.gauge),
        setLeft1: parseFloat(formValuesToConfirm.setLeft1),
        setLeft2: parseFloat(formValuesToConfirm.setLeft2),
        setRight1: parseFloat(formValuesToConfirm.setRight1),
        setRight2: parseFloat(formValuesToConfirm.setRight2),
        setLeftAvg: parseFloat(setLeftAvg.toFixed(2)),
        setRightAvg: parseFloat(setRightAvg.toFixed(2)),
        dateReceived: timestamp,
        createdAt: timestamp,
        goodStatus: formValuesToConfirm.goodStatus, // Stored as boolean
      };

      await addDoc(collection(db, 'Goodsin'), newGoodsIn);
      setSuccessMessage('Goods In report added successfully!');
      formik.resetForm();
    } catch (err) {
      console.error('Error adding Goods In report: ', err);
      setError('Failed to add Goods In report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a supplier map for easy lookup
  const supplierMap = suppliers.reduce((acc, supplier) => {
    acc[supplier.id] = supplier.name;
    return acc;
  }, {});

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
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ mb: 2, color: '#333' }}
      >
        Add New Goods In
      </Typography>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        sx={{ mt: 2 }}
      >
        <Grid container spacing={2}>
          {/* SKU and Supplier */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.sku && Boolean(formik.errors.sku)}
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
              >
                {loadingSkus ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : (
                  skus.map((sku) => (
                    <MenuItem key={sku.id} value={sku.metCode}>
                      {`${sku.metCode} - ${sku.description}`}
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>
                {formik.touched.sku && formik.errors.sku}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.supplier && Boolean(formik.errors.supplier)}
            >
              <InputLabel id="supplier-label">Supplier</InputLabel>
              <Select
                labelId="supplier-label"
                id="supplier"
                name="supplier"
                value={formik.values.supplier}
                label="Supplier"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {loadingSuppliers ? (
                  <MenuItem value="">
                    <em>Loading...</em>
                  </MenuItem>
                ) : (
                  suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {`${supplier.name}`}
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>
                {formik.touched.supplier && formik.errors.supplier}
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Pallet Number and Invoice */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Pallet Number"
              name="palletNumber"
              type="number"
              value={formik.values.palletNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={
                formik.touched.palletNumber &&
                Boolean(formik.errors.palletNumber)
              }
              helperText={
                formik.touched.palletNumber && formik.errors.palletNumber
              }
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Invoice"
              name="invoice"
              value={formik.values.invoice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.invoice && Boolean(formik.errors.invoice)}
              helperText={formik.touched.invoice && formik.errors.invoice}
              inputProps={{
                pattern: '^[0-9]{6}$',
                title: 'Invoice must be 6 digits.',
              }}
            />
          </Grid>

          {/* Height and Gauge */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Height (cm)"
              name="height"
              type="number"
              value={formik.values.height}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.height && Boolean(formik.errors.height)}
              helperText={formik.touched.height && formik.errors.height}
              InputProps={{
                inputProps: { min: 0.1, step: 0.1 },
                style: {
                  backgroundColor:
                    isWithinSpec('height') === null
                      ? ''
                      : isWithinSpec('height')
                      ? '#ccffcc' // Light green for within spec
                      : '#ffcccc', // Light red for out of spec
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Gauge"
              name="gauge"
              type="number"
              value={formik.values.gauge}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.gauge && Boolean(formik.errors.gauge)}
              helperText={formik.touched.gauge && formik.errors.gauge}
              InputProps={{
                inputProps: { min: 0.1, step: 0.1 },
                style: {
                  backgroundColor:
                    isWithinSpec('gauge') === null
                      ? ''
                      : isWithinSpec('gauge')
                      ? '#ccffcc'
                      : '#ffcccc',
                },
              }}
            />
          </Grid>

          {/* Set Left 1 and Set Left 2 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Set Left Min"
              name="setLeft1"
              type="number"
              value={formik.values.setLeft1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.setLeft1 && Boolean(formik.errors.setLeft1)}
              helperText={formik.touched.setLeft1 && formik.errors.setLeft1}
              InputProps={{
                inputProps: { min: 0, step: 1 },
                style: {
                  backgroundColor:
                    isWithinSpec('setLeft1') === null
                      ? ''
                      : isWithinSpec('setLeft1')
                      ? '#ccffcc' // Light green for within spec
                      : '#ffcccc', // Light red for out of spec
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Set Left Max"
              name="setLeft2"
              type="number"
              value={formik.values.setLeft2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.setLeft2 && Boolean(formik.errors.setLeft2)}
              helperText={formik.touched.setLeft2 && formik.errors.setLeft2}
              InputProps={{
                inputProps: { min: 0, step: 1 },
                style: {
                  backgroundColor:
                    isWithinSpec('setLeft2') === null
                      ? ''
                      : isWithinSpec('setLeft2')
                      ? '#ccffcc'
                      : '#ffcccc',
                },
              }}
            />
          </Grid>

          {/* Set Right 1 and Se Right 2 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Set Right Min"
              name="setRight1"
              type="number"
              value={formik.values.setRight1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.setRight1 && Boolean(formik.errors.setRight1)}
              helperText={formik.touched.setRight1 && formik.errors.setRight1}
              InputProps={{
                inputProps: { min: 0, step: 1 },
                style: {
                  backgroundColor:
                    isWithinSpec('setRight1') === null
                      ? ''
                      : isWithinSpec('setRight1')
                      ? '#ccffcc'
                      : '#ffcccc',
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Set Right Max"
              name="setRight2"
              type="number"
              value={formik.values.setRight2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              required
              error={formik.touched.setRight2 && Boolean(formik.errors.setRight2)}
              helperText={formik.touched.setRight2 && formik.errors.setRight2}
              InputProps={{
                inputProps: { min: 0, step: 1 },
                style: {
                  backgroundColor:
                    isWithinSpec('setRight2') === null
                      ? ''
                      : isWithinSpec('setRight2')
                      ? '#ccffcc'
                      : '#ffcccc',
                },
              }}
            />
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
                loadingSuppliers ||
                loadingSkus ||
                loadingSpecifications
              }
              sx={{ py: 1.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Add Goods In Report'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Confirmation Modal */}
      <Dialog
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        aria-labelledby="confirm-submit-title"
      >
        <DialogTitle id="confirm-submit-title">Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The material is marked as{' '}
            <strong>
              {formValuesToConfirm?.goodStatus ? 'Good' : 'Bad'}
            </strong>
            .
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="body1">
              <strong>SKU:</strong> {formValuesToConfirm?.sku}
            </Typography>
            <Typography variant="body1">
              <strong>Pallet Number:</strong> {formValuesToConfirm?.palletNumber}
            </Typography>
            <Typography variant="body1">
              <strong>Supplier:</strong>{' '}
              {supplierMap[formValuesToConfirm?.supplier] ||
                formValuesToConfirm?.supplier}
            </Typography>
            <Typography variant="body1">
              <strong>Invoice:</strong> {formValuesToConfirm?.invoice}
            </Typography>
            <Typography variant="body1">
              <strong>Height:</strong> {formValuesToConfirm?.height} cm
            </Typography>
            <Typography variant="body1">
              <strong>Gauge:</strong> {formValuesToConfirm?.gauge}
            </Typography>

            {/* Set Left Measurements */}
            <Typography variant="body1">
              <strong>Set Left 1:</strong> {formValuesToConfirm?.setLeft1}
            </Typography>
            <Typography variant="body1">
              <strong>Set Left 2:</strong> {formValuesToConfirm?.setLeft2}
            </Typography>
            <Typography variant="body1">
              <strong>Set Left Average:</strong>{' '}
              {calculateAverage(formValuesToConfirm?.setLeft1, formValuesToConfirm?.setLeft2) || 'N/A'}
            </Typography>

            {/* Set Right Measurements */}
            <Typography variant="body1">
              <strong>Set Right 1:</strong> {formValuesToConfirm?.setRight1}
            </Typography>
            <Typography variant="body1">
              <strong>Set Right 2:</strong> {formValuesToConfirm?.setRight2}
            </Typography>
            <Typography variant="body1">
              <strong>Set Right Average:</strong>{' '}
              {calculateAverage(formValuesToConfirm?.setRight1, formValuesToConfirm?.setRight2) || 'N/A'}
            </Typography>

            <Typography variant="body1">
              <strong>Notes:</strong> {formValuesToConfirm?.notes}
            </Typography>
            <Typography variant="body1">
              <strong>Good Status:</strong>{' '}
              {formValuesToConfirm?.goodStatus ? 'Good' : 'Bad'}
            </Typography>

            {/* Quarantine Message if Good Status is "Bad" */}
            {!formValuesToConfirm?.goodStatus && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Quarantine the pallet.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirmModal(false)}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            color="primary"
            autoFocus
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success and Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 4 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
      {specificationsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {specificationsError}
        </Alert>
      )}
      {suppliersError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {suppliersError}
        </Alert>
      )}
      {skusError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {skusError}
        </Alert>
      )}
    </Container>
  );
}

export default GoodsInForm;
