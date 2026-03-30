// src/components/AddRawMaterial.js

import React from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { db } from '../firebase'; // Ensure correct path to your firebase config
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';

function AddRawMaterial() {
  const navigate = useNavigate();

  // State for handling success and error messages
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  // Define the specifications
  const specificationsList = [
    { name: 'height', label: 'Height', type: 'number' },
    { name: 'gauge', label: 'Gauge', type: 'number' },
    { name: 'setLeft', label: 'Set Left', type: 'number' },
    { name: 'setRight', label: 'Set Right', type: 'number' },
  ];

  // Initial form values
  const initialValues = {
    metCode: '',
    description: '',
    revision: '',
    date: '',
    specifications: specificationsList.reduce((acc, spec) => {
      acc[spec.name] = {
        target: '',
        min: '',
        max: '',
      };
      return acc;
    }, {}),
  };

  // Validation schema using Yup
  const validationSchema = Yup.object({
    metCode: Yup.string().required('Met Code is required'),
    description: Yup.string().required('Description is required'),
    revision: Yup.string().required('Revision is required'),
    date: Yup.date().required('Date is required'),
    specifications: Yup.object(
      specificationsList.reduce((acc, spec) => {
        if (spec.name === 'setLeft' || spec.name === 'setRight') {
          // Make 'Set Left' and 'Set Right' optional
          acc[spec.name] = Yup.object({
            target: Yup.number().typeError('Must be a number'),
            min: Yup.number()
              .typeError('Must be a number')
              .test(
                'min-less-than-target',
                'Minimum must be less than Target',
                function (value) {
                  const { target } = this.parent;
                  if (value === undefined || target === undefined) return true;
                  return value < target;
                }
              ),
            max: Yup.number()
              .typeError('Must be a number')
              .test(
                'max-greater-than-target',
                'Maximum must be greater than Target',
                function (value) {
                  const { target } = this.parent;
                  if (value === undefined || target === undefined) return true;
                  return value > target;
                }
              ),
          });
        } else {
          // Required specifications
          acc[spec.name] = Yup.object({
            target: Yup.number()
              .typeError('Must be a number')
              .required('Target is required'),
            min: Yup.number()
              .typeError('Must be a number')
              .required('Minimum is required')
              .test(
                'min-less-than-target',
                'Minimum must be less than Target',
                function (value) {
                  const { target } = this.parent;
                  if (value === undefined || target === undefined) return true;
                  return value < target;
                }
              ),
            max: Yup.number()
              .typeError('Must be a number')
              .required('Maximum is required')
              .test(
                'max-greater-than-target',
                'Maximum must be greater than Target',
                function (value) {
                  const { target } = this.parent;
                  if (value === undefined || target === undefined) return true;
                  return value > target;
                }
              ),
          });
        }
        return acc;
      }, {})
    ),
  });

  // Formik form handling
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSuccess('');
      setError('');

      const {
        metCode,
        description,
        revision,
        date,
        specifications,
      } = values;

      try {
        // Reference to the raw materials collection
        const rawMaterialRef = doc(db, 'Raw Material', metCode);
        const rawMaterialSnap = await getDoc(rawMaterialRef);

        if (!rawMaterialSnap.exists()) {
          // If raw material doesn't exist, create it
          await setDoc(rawMaterialRef, {
            metCode: metCode,
            description: description,
            createdAt: new Date(),
          });
        }

        // Reference to the revision document within the revisions subcollection
        const revisionRef = doc(
          db,
          'Raw Material',
          metCode,
          'revisions',
          revision
        );
        const revisionSnap = await getDoc(revisionRef);

        if (revisionSnap.exists()) {
          setError(
            'A revision with this name already exists for this raw material.'
          );
          return;
        }

        // Transform specifications to desired structure
        const transformedSpecifications = specificationsList.reduce(
          (acc, spec) => {
            acc[spec.name] = {
              target:
                specifications[spec.name].target !== ''
                  ? Number(specifications[spec.name].target)
                  : null,
              min:
                specifications[spec.name].min !== ''
                  ? Number(specifications[spec.name].min)
                  : null,
              max:
                specifications[spec.name].max !== ''
                  ? Number(specifications[spec.name].max)
                  : null,
            };
            return acc;
          },
          {}
        );

        // Create a new revision document with specifications and other details
        await setDoc(revisionRef, {
          revision: revision,
          date: new Date(date),
          specifications: transformedSpecifications,
          createdAt: new Date(),
        });

        setSuccess('Raw material revision added successfully!');
        resetForm();

        // Optionally, redirect to another page after a delay
        setTimeout(() => {
          navigate('/add-raw-material'); // Redirect to the same page or another as needed
        }, 2000);
      } catch (err) {
        console.error('Error adding raw material revision: ', err);
        setError('Failed to add raw material revision. Please try again.');
      }
    },
  });

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add Raw Material Specifications
        </Typography>

        {/* Display Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Display Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          {/* Met Code */}
          <TextField
            label="Met Code"
            variant="outlined"
            fullWidth
            required
            name="metCode"
            value={formik.values.metCode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.metCode && Boolean(formik.errors.metCode)}
            helperText={formik.touched.metCode && formik.errors.metCode}
            margin="normal"
          />

          {/* Description */}
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            required
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.description && Boolean(formik.errors.description)
            }
            helperText={formik.touched.description && formik.errors.description}
            margin="normal"
          />

          {/* Revision */}
          <TextField
            label="Revision"
            variant="outlined"
            fullWidth
            required
            name="revision"
            value={formik.values.revision}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.revision && Boolean(formik.errors.revision)}
            helperText={formik.touched.revision && formik.errors.revision}
            margin="normal"
          />

          {/* Date */}
          <TextField
            label="Date"
            variant="outlined"
            fullWidth
            required
            name="date"
            type="date"
            value={formik.values.date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.date && Boolean(formik.errors.date)}
            helperText={formik.touched.date && formik.errors.date}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Specifications */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Specifications
          </Typography>

          {specificationsList.map((spec) => (
            <Box key={spec.name} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {spec.label}
              </Typography>
              <Grid container spacing={2}>
                {/* Target */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Target"
                    variant="outlined"
                    fullWidth
                    name={`specifications.${spec.name}.target`}
                    value={formik.values.specifications[spec.name].target}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].target &&
                      Boolean(
                        formik.errors.specifications?.[spec.name]?.target
                      )
                    }
                    helperText={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].target &&
                      formik.errors.specifications?.[spec.name]?.target
                    }
                  />
                </Grid>

                {/* Minimum */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Minimum"
                    variant="outlined"
                    fullWidth
                    name={`specifications.${spec.name}.min`}
                    value={formik.values.specifications[spec.name].min}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].min &&
                      Boolean(formik.errors.specifications?.[spec.name]?.min)
                    }
                    helperText={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].min &&
                      formik.errors.specifications?.[spec.name]?.min
                    }
                  />
                </Grid>

                {/* Maximum */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Maximum"
                    variant="outlined"
                    fullWidth
                    name={`specifications.${spec.name}.max`}
                    value={formik.values.specifications[spec.name].max}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].max &&
                      Boolean(formik.errors.specifications?.[spec.name]?.max)
                    }
                    helperText={
                      formik.touched.specifications &&
                      formik.touched.specifications[spec.name] &&
                      formik.touched.specifications[spec.name].max &&
                      formik.errors.specifications?.[spec.name]?.max
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          {/* Submit  Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
          >
            Save Raw Material Specifications
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default AddRawMaterial;
