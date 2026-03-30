// src/components/BlockCalibrationForm.js

import React, { useEffect, useState } from 'react';
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
  Paper,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase'; // Ensure the correct path
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

// Import the useAuth hook
import { useAuth } from '../AuthProvider';

function BlockCalibrationForm() {
  // State Variables for Feedback Messages
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // States for fetching blocks
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blocksError, setBlocksError] = useState('');

  // States for fetching operators
  const [operators, setOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorsError, setOperatorsError] = useState('');

  // Access the auth context for user info
  const { currentUser } = useAuth(); // Use the useAuth hook

  // Fetch Blocks from Firestore on component mount
  useEffect(() => {
    const fetchBlocks = async () => {
      setLoadingBlocks(true);
      setBlocksError('');
      try {
        const blocksCollection = collection(db, 'blocks');
        const blocksSnapshot = await getDocs(blocksCollection);
        const blocksList = blocksSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID is the block's name
          name: doc.data().name || '',
        }));
        setBlocks(blocksList);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setBlocksError('Failed to load blocks. Please try again.');
      } finally {
        setLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, []);

  // Fetch Operators from Firestore on component mount
  useEffect(() => {
    const fetchOperators = async () => {
      setLoadingOperators(true);
      setOperatorsError('');
      try {
        // Corrected the collection name to 'Operators' and field name to 'Name'
        const operatorsCollection = collection(db, 'Operators'); // Collection name with capital 'O'
        const operatorsSnapshot = await getDocs(operatorsCollection);
        const operatorsList = operatorsSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID is the operator's unique ID
          name: doc.data().Name || '', // Use 'Name' with capital 'N'
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

  // Handler to reset measurements when blockName changes
  const handleBlockChange = (blockName, setFieldValue) => {
    // Reset measurements when block changes
    setFieldValue('measurement0_tool1', '');
    setFieldValue('measurement10_tool1', '');
    setFieldValue('measurement20_tool1', '');
    setFieldValue('measurement0_tool2', '');
    setFieldValue('measurement10_tool2', '');
    setFieldValue('measurement20_tool2', '');
  };

  return (
    <Container
      maxWidth="md" // Increased width to accommodate two tool sections
      sx={{
        mt: 4,
        mb: 4,
        p: { xs: 2, sm: 3 }, // Responsive padding
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
          fontSize: { xs: '1.5rem', sm: '2rem' }, // Responsive font size
        }}
      >
        Add New Block Calibration
      </Typography>

      <Formik
        initialValues={{
          blockName: '',
          date: '',
          performedBy: '',
          measurement0_tool1: '',
          measurement10_tool1: '',
          measurement20_tool1: '',
          measurement0_tool2: '',
          measurement10_tool2: '',
          measurement20_tool2: '',
        }}
        validationSchema={Yup.object({
          blockName: Yup.string().required('Block is required'),
          date: Yup.date()
            .required('Calibration Date is required')
            .max(new Date(), 'Calibration date cannot be in the future'),
          performedBy: Yup.string().required('Performed By is required'),
          // Tool 1 Measurements Validation
          measurement0_tool1: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('0 Measurement for Tool 1 is required'),
          measurement10_tool1: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('10 Thou Measurement for Tool 1 is required'),
          measurement20_tool1: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('20 Thou Measurement for Tool 1 is required'),
          // Tool 2 Measurements Validation
          measurement0_tool2: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('0 Measurement for Tool 2 is required'),
          measurement10_tool2: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('10 Thou Measurement for Tool 2 is required'),
          measurement20_tool2: Yup.string()
            .matches(/^\d+(\.\d+)?$/, 'Must be a number')
            .required('20 Thou Measurement for Tool 2 is required'),
        })}
        onSubmit={async (values, { resetForm }) => {
          setLoading(true);
          setError('');
          setSuccessMessage('');

          try {
            // Prepare calibration data
            const calibrationData = {
              blockName: values.blockName, // Document ID (name) of the block
              date: Timestamp.fromDate(new Date(values.date)),
              performedBy: values.performedBy, // Operator's document ID
              tools: {
                tool1: 'Desk Set Checker', // Hardcoded Tool 1 name
                tool2: 'Set Checker', // Hardcoded Tool 2 name
              },
              measurements: {
                tool1: {
                  measurement0: parseFloat(values.measurement0_tool1),
                  measurement10: parseFloat(values.measurement10_tool1),
                  measurement20: parseFloat(values.measurement20_tool1),
                },
                tool2: {
                  measurement0: parseFloat(values.measurement0_tool2),
                  measurement10: parseFloat(values.measurement10_tool2),
                  measurement20: parseFloat(values.measurement20_tool2),
                },
              },
              createdAt: Timestamp.now(),
              acknowledgedBy: currentUser ? currentUser.uid : 'Unknown', // Associate with user
            };

            // Add calibration entry to 'block-calibration' collection
            const calibrationsCollection = collection(db, 'block-calibration');
            const calibrationDocRef = await addDoc(
              calibrationsCollection,
              calibrationData
            );

            console.log('Block Calibration added with ID:', calibrationDocRef.id);

            // Update the corresponding Block's lastCalibrationDate and needsCalibrationDate
            const blockDocRef = doc(db, 'blocks', values.blockName);
            const needsDate = new Date(values.date);
            needsDate.setMonth(needsDate.getMonth() + 6); // Next calibration in 6 months

            await updateDoc(blockDocRef, {
              lastCalibrationDate: Timestamp.fromDate(new Date(values.date)),
              needsCalibrationDate: needsDate.toISOString(),
              latestCalibrationMeasurements: calibrationData.measurements,
              latestCalibrationTools: calibrationData.tools,
            });

            console.log('Block updated with latest calibration.');

            setSuccessMessage('Block calibration added successfully!');
            resetForm();
          } catch (err) {
            console.error('Error adding block calibration:', err);
            setError('Failed to add block calibration. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          touched,
          errors,
          setFieldValue,
        }) => (
          <Form>
            <Grid container spacing={2}>
              {/* Block */}
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  required
                  error={touched.blockName && Boolean(errors.blockName)}
                >
                  <InputLabel id="blockName-label">Block</InputLabel>
                  <Select
                    labelId="blockName-label"
                    id="blockName"
                    name="blockName"
                    value={values.blockName}
                    label="Block"
                    onChange={(e) => {
                      handleChange(e);
                      handleBlockChange(e.target.value, setFieldValue);
                    }}
                    onBlur={handleBlur}
                    disabled={loadingBlocks || Boolean(blocksError)}
                  >
                    {loadingBlocks ? (
                      <MenuItem value="">
                        <em>Loading...</em>
                      </MenuItem>
                    ) : blocks.length > 0 ? (
                      blocks.map((block) => (
                        <MenuItem key={block.id} value={block.id}>
                          {`${block.id} - ${block.name}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">
                        <em>No blocks available</em>
                      </MenuItem>
                    )}
                  </Select>
                  {loadingBlocks && (
                    <FormHelperText>Loading blocks...</FormHelperText>
                  )}
                  {touched.blockName && errors.blockName && (
                    <FormHelperText>{errors.blockName}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Calibration Date */}
              <Grid item xs={12}>
                <TextField
                  label="Calibration Date"
                  name="date"
                  type="date"
                  value={values.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={touched.date && Boolean(errors.date)}
                  helperText={touched.date && errors.date}
                />
              </Grid>

              {/* Performed By */}
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  required
                  error={touched.performedBy && Boolean(errors.performedBy)}
                >
                  <InputLabel id="performedBy-label">Performed By</InputLabel>
                  <Select
                    labelId="performedBy-label"
                    id="performedBy"
                    name="performedBy"
                    value={values.performedBy}
                    label="Performed By"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loadingOperators || Boolean(operatorsError)}
                  >
                    {loadingOperators ? (
                      <MenuItem value="">
                        <em>Loading...</em>
                      </MenuItem>
                    ) : operators.length > 0 ? (
                      operators.map((operator) => (
                        <MenuItem key={operator.id} value={operator.id}>
                          {`${operator.name}`}
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
                  {touched.performedBy && errors.performedBy && (
                    <FormHelperText>{errors.performedBy}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Tool 1 - Hardcoded Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Tool 1: Desk Set Checker
                </Typography>
              </Grid>

              {/* Tool 2 - Hardcoded Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Tool 2: Set Checker
                </Typography>
              </Grid>

              {/* Measurements for Tool 1 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Calibration Measurements for Tool 1: Desk Set Checker
                </Typography>
                <Box component={Paper} sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {/* 0 Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="0"
                        name="measurement0_tool1"
                        type="number"
                        value={values.measurement0_tool1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement0_tool1 &&
                          Boolean(errors.measurement0_tool1)
                        }
                        helperText={
                          touched.measurement0_tool1 &&
                          errors.measurement0_tool1
                        }
                      />
                    </Grid>

                    {/* 10 Thou Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="10 Thou"
                        name="measurement10_tool1"
                        type="number"
                        value={values.measurement10_tool1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement10_tool1 &&
                          Boolean(errors.measurement10_tool1)
                        }
                        helperText={
                          touched.measurement10_tool1 &&
                          errors.measurement10_tool1
                        }
                      />
                    </Grid>

                    {/* 20 Thou Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="20 Thou"
                        name="measurement20_tool1"
                        type="number"
                        value={values.measurement20_tool1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement20_tool1 &&
                          Boolean(errors.measurement20_tool1)
                        }
                        helperText={
                          touched.measurement20_tool1 &&
                          errors.measurement20_tool1
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Measurements for Tool 2 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Calibration Measurements for Tool 2: Set Checker
                </Typography>
                <Box component={Paper} sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {/* 0 Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="0"
                        name="measurement0_tool2"
                        type="number"
                        value={values.measurement0_tool2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement0_tool2 &&
                          Boolean(errors.measurement0_tool2)
                        }
                        helperText={
                          touched.measurement0_tool2 &&
                          errors.measurement0_tool2
                        }
                      />
                    </Grid>

                    {/* 10 Thou Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="10 Thou"
                        name="measurement10_tool2"
                        type="number"
                        value={values.measurement10_tool2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement10_tool2 &&
                          Boolean(errors.measurement10_tool2)
                        }
                        helperText={
                          touched.measurement10_tool2 &&
                          errors.measurement10_tool2
                        }
                      />
                    </Grid>

                    {/* 20 Thou Measurement */}
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="20 Thou"
                        name="measurement20_tool2"
                        type="number"
                        value={values.measurement20_tool2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        required
                        error={
                          touched.measurement20_tool2 &&
                          Boolean(errors.measurement20_tool2)
                        }
                        helperText={
                          touched.measurement20_tool2 &&
                          errors.measurement20_tool2
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Submit  Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={
                    loading ||
                    loadingBlocks ||
                    loadingOperators ||
                    Boolean(blocksError) ||
                    Boolean(operatorsError)
                  }
                  sx={{
                    py: 1.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
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
                    'Add Calibration'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 4 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}

      {/* Blocks Fetch Error */}
      {blocksError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {blocksError}
        </Alert>
      )}

      {/* Operators Fetch Error */}
      {operatorsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {operatorsError}
        </Alert>
      )}
    </Container>
  );
}

export default BlockCalibrationForm;
