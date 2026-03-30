// src/components/CalibrationForm.js

import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import { Formik, Form, FieldArray } from 'formik';
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

function CalibrationForm() {
  // State Variables for Feedback Messages
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // States for fetching measurement tools
  const [measurementTools, setMeasurementTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [toolsError, setToolsError] = useState('');

  // States for fetching operators
  const [operators, setOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorsError, setOperatorsError] = useState('');

  // State for serial number
  const [serialNumber, setSerialNumber] = useState('');

  // Fetch Measurement Tools from Firestore on component mount
  useEffect(() => {
    const fetchMeasurementTools = async () => {
      setLoadingTools(true);
      setToolsError('');
      try {
        const toolsCollection = collection(db, 'MeasurementTools');
        const toolsSnapshot = await getDocs(toolsCollection);
        const toolsList = toolsSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID is the tool's name
          serial: doc.data().serial || '',
          name: doc.data().name || '',
        }));
        setMeasurementTools(toolsList);
      } catch (err) {
        console.error('Error fetching measurement tools:', err);
        setToolsError('Failed to load measurement tools. Please try again.');
      } finally {
        setLoadingTools(false);
      }
    };

    fetchMeasurementTools();
  }, []);

  // Fetch Operators from Firestore on component mount
  useEffect(() => {
    const fetchOperators = async () => {
      setLoadingOperators(true);
      setOperatorsError('');
      try {
        const operatorsCollection = collection(db, 'Operators');
        const operatorsSnapshot = await getDocs(operatorsCollection);
        const operatorsList = operatorsSnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID is the operator's unique ID
          name: doc.data().name || '',
          // Include other fields as necessary
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

  // Handler to update serial number when toolName changes
  const handleToolChange = (toolName, setFieldValue) => {
    const selectedTool = measurementTools.find((tool) => tool.id === toolName);
    if (selectedTool) {
      setSerialNumber(selectedTool.serial);
    } else {
      setSerialNumber('');
    }
    // Reset results when tool changes
    setFieldValue('results', initialResults);
  };

  // Initial Results Array with Tests 1, 2, 3
  const initialResults = [
    {
      test: 'Test 1',
      level0: '',
      level025: '',
      level05: '',
      level075: '',
      level1: '',
      level2: '',
      level3: '',
      level6: '',
    },
    {
      test: 'Test 2',
      level0: '',
      level025: '',
      level05: '',
      level075: '',
      level1: '',
      level2: '',
      level3: '',
      level6: '',
    },
    {
      test: 'Test 3',
      level0: '',
      level025: '',
      level05: '',
      level075: '',
      level1: '',
      level2: '',
      level3: '',
      level6: '',
    },
  ];

  return (
    <Container
      maxWidth="md"
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
        Add New Calibration
      </Typography>

      <Formik
        initialValues={{
          toolName: '',
          date: '',
          performedBy: '',
          results: initialResults, // Pre-populated results
        }}
        validationSchema={Yup.object({
          toolName: Yup.string().required('Measurement Tool is required'),
          date: Yup.date()
            .required('Calibration Date is required')
            .max(new Date(), 'Calibration date cannot be in the future'),
          performedBy: Yup.string().required('Performed By is required'),
          results: Yup.array().of(
            Yup.object({
              test: Yup.string().required(),
              level0: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level025: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level05: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level075: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level1: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level2: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level3: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
              level6: Yup.string()
                .matches(/^\d+(\.\d+)?$/, 'Must be a number')
                .nullable(),
            })
          ),
        })}
        onSubmit={async (values, { resetForm }) => {
          setLoading(true);
          setError('');
          setSuccessMessage('');

          try {
            // Prepare calibration data
            const calibrationData = {
              toolName: values.toolName, // Document ID (name) of the tool
              serial: serialNumber, // Serial number fetched based on selected tool
              date: Timestamp.fromDate(new Date(values.date)),
              performedBy: values.performedBy, // Operator's document ID
              results: values.results.map((result) => ({
                test: result.test,
                level0: result.level0 ? parseFloat(result.level0) : null,
                level025: result.level025 ? parseFloat(result.level025) : null,
                level05: result.level05 ? parseFloat(result.level05) : null,
                level075: result.level075 ? parseFloat(result.level075) : null,
                level1: result.level1 ? parseFloat(result.level1) : null,
                level2: result.level2 ? parseFloat(result.level2) : null,
                level3: result.level3 ? parseFloat(result.level3) : null,
                level6: result.level6 ? parseFloat(result.level6) : null,
              })),
              createdAt: Timestamp.now(),
            };

            // Add calibration entry to 'Calibrations' collection
            const calibrationsCollection = collection(db, 'Calibrations');
            const calibrationDocRef = await addDoc(calibrationsCollection, calibrationData);

            console.log('Calibration added with ID:', calibrationDocRef.id);

            // Update the corresponding MeasurementTool's lastCalibrationDate and needsCalibrationDate
            const toolDocRef = doc(db, 'MeasurementTools', values.toolName);
            const needsDate = new Date(values.date);
            needsDate.setMonth(needsDate.getMonth() + 6); // Next calibration in 6 months

            await updateDoc(toolDocRef, {
              lastCalibrationDate: Timestamp.fromDate(new Date(values.date)),
              needsCalibrationDate: needsDate.toISOString(),
              latestCalibrationResults: calibrationData.results.length > 0 ? calibrationData.results : null,
            });

            console.log('MeasurementTool updated with latest calibration.');

            setSuccessMessage('Calibration added successfully!');
            resetForm();
            setSerialNumber(''); // Reset serial number
          } catch (err) {
            console.error('Error adding calibration:', err);
            setError('Failed to add calibration. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ values, handleChange, handleBlur, touched, errors, setFieldValue }) => (
          <Form>
            <Grid container spacing={2}>
              {/* Measurement Tool */}
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  required
                  error={touched.toolName && Boolean(errors.toolName)}
                >
                  <InputLabel id="toolName-label">Measurement Tool</InputLabel>
                  <Select
                    labelId="toolName-label"
                    id="toolName"
                    name="toolName"
                    value={values.toolName}
                    label="Measurement Tool"
                    onChange={(e) => {
                      handleChange(e);
                      handleToolChange(e.target.value, setFieldValue);
                    }}
                    onBlur={handleBlur}
                    disabled={loadingTools || Boolean(toolsError)}
                  >
                    {loadingTools ? (
                      <MenuItem value="">
                        <em>Loading...</em>
                      </MenuItem>
                    ) : measurementTools.length > 0 ? (
                      measurementTools.map((tool) => (
                        <MenuItem key={tool.id} value={tool.id}>
                          {`${tool.id} - ${tool.serial} - ${tool.name}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">
                        <em>No measurement tools available</em>
                      </MenuItem>
                    )}
                  </Select>
                  {loadingTools && (
                    <FormHelperText>Loading measurement tools...</FormHelperText>
                  )}
                  {touched.toolName && errors.toolName && (
                    <FormHelperText>{errors.toolName}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Serial Number */}
              <Grid item xs={12}>
                <TextField
                  label="Serial Number"
                  name="serialNumber"
                  value={serialNumber}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Serial number is auto-populated based on the selected tool."
                />
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
                  {touched.performedBy && errors.performedBy && (
                    <FormHelperText>{errors.performedBy}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Results Table */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Calibration Results (if applicable)
                </Typography>
                <Paper>
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
                      <FieldArray
                        name="results"
                        render={() =>
                          values.results.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body1">{result.test}</Typography>
                              </TableCell>
                              {['level0', 'level025', 'level05', 'level075', 'level1', 'level2', 'level3', 'level6'].map(
                                (level) => (
                                  <TableCell key={level}>
                                    <TextField
                                      name={`results[${index}].${level}`}
                                      value={result[level]}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={
                                        touched.results &&
                                        touched.results[index] &&
                                        touched.results[index][level] &&
                                        Boolean(
                                          errors.results &&
                                            errors.results[index] &&
                                            errors.results[index][level]
                                        )
                                      }
                                      helperText={
                                        touched.results &&
                                        touched.results[index] &&
                                        touched.results[index][level] &&
                                        errors.results &&
                                        errors.results[index] &&
                                        errors.results[index][level]
                                      }
                                      variant="outlined"
                                      size="small"
                                      fullWidth
                                      placeholder="Enter value"
                                    />
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          ))
                        }
                      />
                    </TableBody>
                  </Table>
                </Paper>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  * Fill in the results as needed. Leave blank if not applicable.
                </Typography>
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
                    loadingTools ||
                    loadingOperators ||
                    Boolean(toolsError) ||
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

      {/* Measurement Tools Fetch Erro */}
      {toolsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {toolsError}
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

export default CalibrationForm;
