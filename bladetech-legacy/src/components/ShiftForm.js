// src/components/ShiftForm.js

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Formik, Form, FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';

const activityLabels = [
  'Laser1',
  'Laser2',
  'Welder',
  'Coating',
  'Stacking',
  'OperatorActivity',
];

// --- Helper Component: AutoBoxes ---
const AutoBoxes = () => {
  const { values, setFieldValue } = useFormikContext();

  useEffect(() => {
    const fetchBoxes = async () => {
      if (!values.date || !values.operator) return;
      try {
        // Example: Laser1
        const q1 = query(
          collection(db, 'LabelBoxes'),
          where('date', '==', values.date),
          where('operator', '==', values.operator),
          where('laser', '==', 'Laser1')
        );
        const snapshot1 = await getDocs(q1);
        const count1 = snapshot1.docs.length;
        // Hard-coded to the first entry of Laser1's array:
        setFieldValue('activities.0.entries.0.BoxesComplete', count1);

        // Example: Laser2
        const q2 = query(
          collection(db, 'LabelBoxes'),
          where('date', '==', values.date),
          where('operator', '==', values.operator),
          where('laser', '==', 'Laser2')
        );
        const snapshot2 = await getDocs(q2);
        const count2 = snapshot2.docs.length;
        // Hard-coded to the first entry of Laser2's array:
        setFieldValue('activities.1.entries.0.BoxesComplete', count2);
      } catch (err) {
        console.error('Error fetching box counts:', err);
      }
    };
    fetchBoxes();
  }, [values.date, values.operator, setFieldValue]);

  return null;
};

const ShiftForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Add local UI states for operators/skus/invoice
  const [operators, setOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorsError, setOperatorsError] = useState('');

  const [skus, setSkus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [skusError, setSkusError] = useState('');

  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoicesError, setInvoicesError] = useState('');

  // ---------- NEW state for the "Units > 9999" warning dialog ----------
  const [openMaxUnitsDialog, setOpenMaxUnitsDialog] = useState(false);

  // ---------- NEW state for the "Time Spent Required" modal ----------
  const [openTimeSpentDialog, setOpenTimeSpentDialog] = useState(false);
  const [pendingTimeSpentEntry, setPendingTimeSpentEntry] = useState(null);
  const [timeSpentInput, setTimeSpentInput] = useState('');

  // Fetch Operators
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const operatorsCollection = collection(db, 'Operators');
        const operatorsSnapshot = await getDocs(operatorsCollection);
        const operatorsList = operatorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
        }));
        setOperators(operatorsList);
      } catch (err) {
        console.error('Error fetching operators:', err);
        setOperatorsError('Failed to load operators.');
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, []);

  // Fetch SKUs
  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const skusCollection = collection(db, 'products');
        const skusSnapshot = await getDocs(skusCollection);
        const skusList = skusSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
        }));
        setSkus(skusList);
      } catch (err) {
        console.error('Error fetching SKUs:', err);
        setSkusError('Failed to load SKUs.');
      } finally {
        setLoadingSkus(false);
      }
    };

    fetchSkus();
  }, []);

  // Fetch Invoice Numbers
  useEffect(() => {
    const fetchInvoiceNumbers = async () => {
      try {
        const invoicesCollection = collection(db, 'Goodsin');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        const invoicesList = invoicesSnapshot.docs
          .map((doc) => doc.data().invoice)
          .filter((invoice) => invoice);
        const uniqueInvoices = [...new Set(invoicesList)];
        setInvoiceNumbers(uniqueInvoices);
      } catch (err) {
        console.error('Error fetching invoice numbers:', err);
        setInvoicesError('Failed to load invoice numbers.');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoiceNumbers();
  }, []);

  // Format date
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (`0${today.getMonth() + 1}`).slice(-2);
    const day = (`0${today.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Calculate hours worked
  const calculateHoursWorked = (startTime, finishTime) => {
    if (!startTime || !finishTime) return '0.00';
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [finishHour, finishMinute] = finishTime.split(':').map(Number);
    let startTotal = startHour * 60 + startMinute;
    let finishTotal = finishHour * 60 + finishMinute;
    if (finishTotal < startTotal) {
      // crosses midnight
      finishTotal += 24 * 60;
    }
    const totalMinutes = finishTotal - startTotal;
    return (totalMinutes / 60).toFixed(2);
  };

  // Calculate hours booked
  const calculateHoursBooked = (activities) => {
    let total = 0;
    activities.forEach((activity) => {
      activity.entries.forEach((entry) => {
        const time = parseFloat(entry.TimeSpent);
        total += isNaN(time) ? 0 : time;
      });
    });
    return total.toFixed(2);
  };

  // Define initial activities
  const initialActivities = activityLabels.map((label) => {
    const entry = {
      UnitsProduced: '',
      Scrap: '',
      Sku: '',
      TimeSpent: '',
      InvoiceNumber: '',
    };
    if (label === 'Laser1' || label === 'Laser2') {
      entry.BoxesComplete = '';
    }
    return { name: label, entries: [entry] };
  });

  // Form validations - UPDATED TO REQUIRE TIME SPENT FOR ANY ACTIVITY
  const validationSchema = Yup.object().shape({
    date: Yup.date()
      .required('Date is required')
      .typeError('Date must be a valid date'),
    shift: Yup.string()
      .oneOf(['Days', 'Nights'], 'Select a valid shift')
      .required('Shift is required'),
    operator: Yup.string().required('Operator is required'),
    timeStart: Yup.string()
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Time Start must be in HH:MM format'
      )
      .required('Time Start is required'),
    timeFinish: Yup.string()
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Time Finish must be in HH:MM format'
      )
      .required('Time Finish is required'),
    comments: Yup.string().nullable(),

    activities: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required(),
        entries: Yup.array()
          .of(
            Yup.object().shape({
              UnitsProduced: Yup.number()
                .typeError('Units Produced must be a number')
                .integer('Units Produced must be an integer')
                .min(0, 'Units Produced cannot be negative')
                .nullable(true),
              Scrap: Yup.number()
                .typeError('Scrap must be a number')
                .integer('Scrap must be an integer')
                .min(0, 'Scrap cannot be negative')
                .nullable(true),
              Sku: Yup.string(),
              TimeSpent: Yup.number()
                .typeError('Time Spent must be a number')
                .min(0, 'Time Spent cannot be negative')
                .nullable(true),
              InvoiceNumber: Yup.string(),
              BoxesComplete: Yup.number()
                .transform((value, originalValue) =>
                  originalValue === '' ? null : value
                )
                .typeError('Boxes complete must be a number')
                .min(0, 'Boxes complete cannot be negative')
                .nullable(true),
            })
          )
          .test(
            'entry-fields',
            'Time Spent is required for any activity entry.',
            (entries) => {
              for (let entry of entries) {
                const { 
                  UnitsProduced, 
                  Scrap, 
                  Sku, 
                  TimeSpent, 
                  InvoiceNumber, 
                  BoxesComplete 
                } = entry;
                
                // Check if any field is filled (indicating this is an active entry)
                const isAnyFieldFilled =
                  UnitsProduced !== '' ||
                  Scrap !== '' ||
                  Sku !== '' ||
                  InvoiceNumber !== '' ||
                  BoxesComplete !== '';
                
                // If any field is filled, Time Spent must be filled
                if (isAnyFieldFilled && (TimeSpent === '' || TimeSpent === null || TimeSpent === undefined)) {
                  return false;
                }
              }
              return true;
            }
          ),
      })
    ),
  });

  // The main form
  return (
    <Container
      maxWidth="lg"
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
        Productivity Report
      </Typography>

      <Formik
        initialValues={{
          date: getTodayDate(),
          shift: '',
          operator: '',
          timeStart: '07:00',
          timeFinish: '17:00',
          comments: '',
          activities: initialActivities,
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
          setLoading(true);
          setError('');
          setSuccess(false);

          try {
            const hoursWorked = calculateHoursWorked(
              values.timeStart,
              values.timeFinish
            );
            const hoursBooked = calculateHoursBooked(values.activities);
            const formattedData = {
              date: values.date
                ? Timestamp.fromDate(new Date(values.date))
                : null,
              shift: values.shift || null,
              operator: values.operator || null,
              timeStart: values.timeStart || null,
              timeFinish: values.timeFinish || null,
              hoursWorked: parseFloat(hoursWorked),
              hoursBooked: parseFloat(hoursBooked),
              comments: values.comments || null,
            };

            // Save shift-level doc
            const shiftDataCollection = collection(db, 'Shiftdata');
            const shiftDocRef = await addDoc(shiftDataCollection, formattedData);

            // Save each subcollection activity
            const activityPromises = values.activities.map(async (activity) => {
              const { name, entries } = activity;
              const entryPromises = entries.map(async (entry) => {
                const {
                  UnitsProduced,
                  Scrap,
                  Sku,
                  TimeSpent,
                  InvoiceNumber,
                  BoxesComplete,
                } = entry;

                // If no meaningful input in this row, skip
                const isAnyFieldFilled =
                  UnitsProduced !== '' ||
                  TimeSpent !== '' ||
                  BoxesComplete !== '';
                if (isAnyFieldFilled) {
                  const activityData = {
                    UnitsProduced:
                      UnitsProduced !== ''
                        ? parseInt(UnitsProduced, 10)
                        : 0,
                    ...(Scrap !== '' && { Scrap: parseInt(Scrap, 10) }),
                    Sku: Sku !== '' ? Sku : null,
                    TimeSpent:
                      TimeSpent !== ''
                        ? parseFloat(TimeSpent)
                        : 0,
                    ...(InvoiceNumber !== '' && { InvoiceNumber }),
                  };

                  if (
                    (name === 'Laser1' || name === 'Laser2') &&
                    BoxesComplete !== ''
                  ) {
                    activityData.BoxesComplete = parseInt(BoxesComplete, 10);
                  }

                  const subCollectionName = name.replace(/\s+/g, '');
                  const activityCollection = collection(
                    shiftDocRef,
                    subCollectionName
                  );
                  await addDoc(activityCollection, activityData);
                }
              });
              await Promise.all(entryPromises);
            });

            await Promise.all(activityPromises);
            setSuccess(true);
            resetForm();
          } catch (err) {
            console.error('Error submitting form:', err);
            setError(
              'An error occurred while saving the data. Please try again.'
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
          const hoursBooked = calculateHoursBooked(values.activities);

          // Custom handler for UnitsProduced onChange:
          const handleUnitsProducedChange = (
            e,
            activityIndex,
            entryIndex
          ) => {
            const val = e.target.value;
            // Show a modal warning if user types above 9999
            if (val !== '' && parseInt(val, 10) > 9999) {
              setOpenMaxUnitsDialog(true);
            }
            // Let Formik continue to track this input
            handleChange(e);
          };

          // Helper function to check if Time Spent is needed
          const checkTimeSpentRequired = (activityIndex, entryIndex, fieldName, value) => {
            const entry = values.activities[activityIndex].entries[entryIndex];
            const currentTimeSpent = entry.TimeSpent;
            
            // If Time Spent is already filled, no need to prompt
            if (currentTimeSpent && currentTimeSpent !== '') {
              return;
            }
            
            // Check if this field change makes the entry have data
            const updatedEntry = { ...entry, [fieldName]: value };
            const isAnyFieldFilled =
              updatedEntry.UnitsProduced !== '' ||
              updatedEntry.Scrap !== '' ||
              updatedEntry.Sku !== '' ||
              updatedEntry.InvoiceNumber !== '' ||
              updatedEntry.BoxesComplete !== '';
            
            // If any field is now filled and Time Spent is empty, prompt for it
            if (isAnyFieldFilled && (!currentTimeSpent || currentTimeSpent === '')) {
              setPendingTimeSpentEntry({ activityIndex, entryIndex });
              setTimeSpentInput('');
              setOpenTimeSpentDialog(true);
            }
          };

          // Custom change handler that checks for Time Spent requirement
          const handleFieldChangeWithTimeCheck = (e, activityIndex, entryIndex) => {
            const { name, value } = e.target;
            const fieldName = name.split('.').pop(); // Get the field name (e.g., 'Sku' from 'activities.0.entries.0.Sku')
            
            // Update the field first
            handleChange(e);
            
            // Then check if we need Time Spent
            setTimeout(() => {
              checkTimeSpentRequired(activityIndex, entryIndex, fieldName, value);
            }, 100);
          };

          // Handle Time Spent dialog save
          const handleTimeSpentSave = () => {
            if (pendingTimeSpentEntry && timeSpentInput) {
              const { activityIndex, entryIndex } = pendingTimeSpentEntry;
              setFieldValue(`activities.${activityIndex}.entries.${entryIndex}.TimeSpent`, timeSpentInput);
            }
            setOpenTimeSpentDialog(false);
            setPendingTimeSpentEntry(null);
            setTimeSpentInput('');
          };

          // Handle Time Spent dialog cancel
          const handleTimeSpentCancel = () => {
            setOpenTimeSpentDialog(false);
            setPendingTimeSpentEntry(null);
            setTimeSpentInput('');
          };

          return (
            <Form>
              {/* AutoBoxes updates BoxesComplete for Laser1 & Laser2 */}
              <AutoBoxes />

              <Box noValidate sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Date, Shift, Operator */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Date *"
                      name="date"
                      type="date"
                      value={values.date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={touched.date && Boolean(errors.date)}
                      helperText={touched.date && errors.date}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={touched.shift && Boolean(errors.shift)}
                    >
                      <InputLabel id="shift-label">Shift *</InputLabel>
                      <Select
                        labelId="shift-label"
                        id="shift"
                        name="shift"
                        value={values.shift}
                        label="Shift *"
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        <MenuItem value="Days">Days</MenuItem>
                        <MenuItem value="Nights">Nights</MenuItem>
                      </Select>
                      {touched.shift && errors.shift && (
                        <FormHelperText>{errors.shift}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={touched.operator && Boolean(errors.operator)}
                    >
                      <InputLabel id="operator-label">Operator *</InputLabel>
                      <Select
                        labelId="operator-label"
                        id="operator"
                        name="operator"
                        value={values.operator}
                        label="Operator *"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loadingOperators || Boolean(operatorsError)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {loadingOperators ? (
                          <MenuItem value="">
                            <em>Loading...</em>
                          </MenuItem>
                        ) : operators.length > 0 ? (
                          operators.map((op) => (
                            <MenuItem key={op.id} value={op.id}>
                              {op.id} - {op.name}
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
                      {touched.operator && errors.operator && (
                        <FormHelperText>{errors.operator}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Times */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Time Start *"
                      name="timeStart"
                      type="time"
                      value={values.timeStart}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      required
                      inputProps={{ step: 300 }}
                      error={touched.timeStart && Boolean(errors.timeStart)}
                      helperText={touched.timeStart && errors.timeStart}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Time Finish *"
                      name="timeFinish"
                      type="time"
                      value={values.timeFinish}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      required
                      inputProps={{ step: 300 }}
                      error={touched.timeFinish && Boolean(errors.timeFinish)}
                      helperText={touched.timeFinish && errors.timeFinish}
                    />
                  </Grid>
                  {/* Hours */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Hours Worked"
                      name="hoursWorked"
                      type="number"
                      value={calculateHoursWorked(values.timeStart, values.timeFinish)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      helperText="Difference between Time Start and Time Finish."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Hours Booked"
                      name="hoursBooked"
                      type="number"
                      value={hoursBooked}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      helperText="Sum of Time Spent across all activities."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  {/* Activities */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Activities
                    </Typography>

                    {values.activities.map((activity, activityIndex) => (
                      <Box
                        key={activityIndex}
                        sx={{
                          border: '1px solid #ccc',
                          padding: 2,
                          borderRadius: 2,
                          mb: 2,
                          backgroundColor: '#fff',
                          boxShadow: 1,
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          {activity.name} Activity
                        </Typography>
                        <FieldArray name={`activities.${activityIndex}.entries`}>
                          {({ push, remove }) => (
                            <div>
                              {activity.entries.map((entry, entryIndex) => {
                                const baseName = `activities.${activityIndex}.entries.${entryIndex}`;
                                return (
                                  <Grid
                                    container
                                    spacing={2}
                                    alignItems="center"
                                    key={entryIndex}
                                  >
                                    {/* UNITS PRODUCED with onChange intercept */}
                                    <Grid item xs={12} sm={2}>
                                      <TextField
                                        label="Units Produced"
                                        name={`${baseName}.UnitsProduced`}
                                        type="number"
                                        value={entry.UnitsProduced}
                                        onChange={(e) => {
                                          handleUnitsProducedChange(e, activityIndex, entryIndex);
                                          handleFieldChangeWithTimeCheck(e, activityIndex, entryIndex);
                                        }}
                                        onBlur={handleBlur}
                                        fullWidth
                                        inputProps={{ min: 0 }}
                                        error={
                                          touched.activities &&
                                          touched.activities[activityIndex] &&
                                          touched.activities[activityIndex].entries &&
                                          touched.activities[activityIndex].entries[
                                            entryIndex
                                          ] &&
                                          touched.activities[activityIndex].entries[entryIndex]
                                            .UnitsProduced &&
                                          Boolean(
                                            errors.activities &&
                                              errors.activities[activityIndex] &&
                                              errors.activities[activityIndex].entries &&
                                              errors.activities[activityIndex].entries[entryIndex] &&
                                              errors.activities[activityIndex].entries[entryIndex]
                                                .UnitsProduced
                                          )
                                        }
                                        helperText={
                                          touched.activities &&
                                          touched.activities[activityIndex] &&
                                          touched.activities[activityIndex].entries &&
                                          touched.activities[activityIndex].entries[
                                            entryIndex
                                          ] &&
                                          touched.activities[activityIndex].entries[entryIndex]
                                            .UnitsProduced &&
                                          errors.activities &&
                                          errors.activities[activityIndex] &&
                                          errors.activities[activityIndex].entries &&
                                          errors.activities[activityIndex].entries[entryIndex] &&
                                          errors.activities[activityIndex].entries[entryIndex]
                                            .UnitsProduced
                                        }
                                      />
                                    </Grid>

                                    {/* Laser1/Laser2 might have scrap */}
                                    {['Laser1', 'Laser2'].includes(activity.name) && (
                                      <Grid item xs={12} sm={2}>
                                        <TextField
                                          label="Scrap"
                                          name={`${baseName}.Scrap`}
                                          type="number"
                                          value={entry.Scrap}
                                          onChange={(e) => handleFieldChangeWithTimeCheck(e, activityIndex, entryIndex)}
                                          onBlur={handleBlur}
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                    )}

                                    {/* SKU */}
                                    <Grid item xs={12} sm={2}>
                                      <FormControl fullWidth>
                                        <InputLabel>SKU</InputLabel>
                                        <Select
                                          name={`${baseName}.Sku`}
                                          value={entry.Sku}
                                          label="SKU"
                                          onChange={(e) => handleFieldChangeWithTimeCheck(e, activityIndex, entryIndex)}
                                          onBlur={handleBlur}
                                          disabled={loadingSkus || Boolean(skusError)}
                                        >
                                          <MenuItem value="">
                                            <em>None</em>
                                          </MenuItem>
                                          {loadingSkus ? (
                                            <MenuItem value="">
                                              <em>Loading...</em>
                                            </MenuItem>
                                          ) : skus.length > 0 ? (
                                            skus.map((sku) => (
                                              <MenuItem key={sku.id} value={sku.id}>
                                                {sku.id}
                                              </MenuItem>
                                            ))
                                          ) : (
                                            <MenuItem value="">
                                              <em>No SKUs available</em>
                                            </MenuItem>
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Grid>

                                    {/* Time Spent */}
                                    <Grid item xs={12} sm={2}>
                                      <TextField
                                        label="Time Spent (hrs)"
                                        name={`${baseName}.TimeSpent`}
                                        type="number"
                                        value={entry.TimeSpent}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        inputProps={{ min: 0, step: 0.1 }}
                                      />
                                    </Grid>

                                    {/* Invoice Number */}
                                    <Grid item xs={12} sm={2}>
                                      <FormControl fullWidth>
                                        <InputLabel>Invoice Number</InputLabel>
                                        <Select
                                          name={`${baseName}.InvoiceNumber`}
                                          value={entry.InvoiceNumber}
                                          label="Invoice Number"
                                          onChange={(e) => handleFieldChangeWithTimeCheck(e, activityIndex, entryIndex)}
                                          onBlur={handleBlur}
                                          disabled={loadingInvoices || Boolean(invoicesError)}
                                        >
                                          <MenuItem value="">
                                            <em>None</em>
                                          </MenuItem>
                                          {loadingInvoices ? (
                                            <MenuItem value="">
                                              <em>Loading...</em>
                                            </MenuItem>
                                          ) : (
                                            invoiceNumbers.map((inv) => (
                                              <MenuItem key={inv} value={inv}>
                                                {inv}
                                              </MenuItem>
                                            ))
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Grid>

                                    {/* BoxesComplete only if Laser1 or Laser2 */}
                                    {['Laser1', 'Laser2'].includes(activity.name) && (
                                      <Grid item xs={12} sm={2}>
                                        <TextField
                                          label="Boxes Complete"
                                          name={`${baseName}.BoxesComplete`}
                                          type="number"
                                          value={entry.BoxesComplete}
                                          onChange={(e) => handleFieldChangeWithTimeCheck(e, activityIndex, entryIndex)}
                                          onBlur={handleBlur}
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                    )}

                                    <Grid item xs={12} sm={1}>
                                      <Button
                                        type="button"
                                        onClick={() => remove(entryIndex)}
                                        variant="outlined"
                                        color="secondary"
                                      >
                                        Remove
                                      </Button>
                                    </Grid>
                                  </Grid>
                                );
                              })}

                              <Button
                                type="button"
                                onClick={() =>
                                  push({
                                    UnitsProduced: '',
                                    Scrap: '',
                                    Sku: '',
                                    TimeSpent: '',
                                    InvoiceNumber: '',
                                    ...( ['Laser1', 'Laser2'].includes(activity.name) && {
                                      BoxesComplete: '',
                                    } ),
                                  })
                                }
                                variant="contained"
                                color="primary"
                                sx={{ mt: 2 }}
                              >
                                Add Entry
                              </Button>
                            </div>
                          )}
                        </FieldArray>
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  {/* Comments */}
                  <Grid item xs={12}>
                    <TextField
                      label="Comments"
                      name="comments"
                      value={values.comments}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={
                        loading ||
                        loadingSkus ||
                        loadingOperators ||
                        loadingInvoices ||
                        Boolean(skusError) ||
                        Boolean(operatorsError) ||
                        Boolean(invoicesError)
                      }
                      sx={{
                        py: 1.5,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        backgroundColor: '#4eb857',
                        '&:hover': { backgroundColor: '#3da34a' },
                        '&:disabled': { backgroundColor: '#cccccc', cursor: 'not-allowed' },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Warning Dialog if user enters more than 9999 in Units Produced */}
              <Dialog
                open={openMaxUnitsDialog}
                onClose={() => setOpenMaxUnitsDialog(false)}
              >
                <DialogTitle>Warning: High Value Entered</DialogTitle>
                <DialogContent>
                  You have entered a value above 9999 in "Units Produced." Please
                  verify this is correct.
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenMaxUnitsDialog(false)} autoFocus>
                    OK
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Time Spent Required Dialog */}
              <Dialog
                open={openTimeSpentDialog}
                onClose={handleTimeSpentCancel}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Time Spent Required</DialogTitle>
                <DialogContent>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    You've entered activity data. Please specify how much time was spent on this activity.
                  </Typography>
                  <TextField
                    autoFocus
                    label="Time Spent (hours)"
                    type="number"
                    fullWidth
                    value={timeSpentInput}
                    onChange={(e) => setTimeSpentInput(e.target.value)}
                    inputProps={{ min: 0, step: 0.1 }}
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleTimeSpentCancel}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTimeSpentSave} 
                    variant="contained"
                    disabled={!timeSpentInput || parseFloat(timeSpentInput) <= 0}
                  >
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </Form>
          );
        }}
      </Formik>

      {success && (
        <Alert severity="success" sx={{ mt: 4 }}>
          Data saved successfully!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
      {operatorsError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {operatorsError}
        </Alert>
      )}
      {skusError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {skusError}
        </Alert>
      )}
      {invoicesError && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {invoicesError}
        </Alert>
      )}
    </Container>
  );
};

export default ShiftForm;