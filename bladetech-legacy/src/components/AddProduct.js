// src/components/AddProduct.js

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
import SaveIcon from '@mui/icons-material/Save';
import { db } from '../firebase'; // Ensure correct path to your firebase config
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Define your specifications here
const specificationsList = [
  { name: 'height', label: 'Height', type: 'number' },
  { name: 'bladeWidth', label: 'Blade Width', type: 'number' },
  { name: 'bladeBody', label: 'Blade Body', type: 'number' },
  { name: 'bladeBottom', label: 'Blade Bottom', type: 'number' },
  { name: 'toothSet', label: 'Tooth Set', type: 'number' },
  { name: 'gauge', label: 'Gauge', type: 'number' },
  { name: 'dross', label: 'Dross', type: 'text' },
  { name: 'flatness', label: 'Flatness', type: 'number' }, // New Flatness Specification
  // Add more specifications as needed
];

// Updated initial form values including packing instructions and per box amount
const initialValues = {
  sku: '',
  revision: '',
  packingInstructions: '',
  perBoxAmount: '',
  specifications: specificationsList.reduce((acc, spec) => {
    acc[spec.name] = {
      target: '',
      min: '',
      max: '',
    };
    return acc;
  }, {}),
};

// Updated validation schema with new fields
const validationSchema = Yup.object({
  sku: Yup.string()
    .required('SKU is required')
    .matches(
      /^[A-Z0-9.]+$/,
      'SKU must be alphanumeric, uppercase, and can include periods'
    ),
  revision: Yup.string().required('Revision is required'),
  packingInstructions: Yup.string().required('Packing Instructions are required'),
  perBoxAmount: Yup.number()
    .typeError('Per Box Amount must be a number')
    .required('Per Box Amount is required'),
  specifications: Yup.object(
    specificationsList.reduce((acc, spec) => {
      if (spec.type === 'number') {
        if (spec.name === 'toothSet') {
          // Make 'toothSet' optional
          acc[spec.name] = Yup.object({
            target: Yup.number()
              .typeError('Must be a number')
              .required('Target is required'),
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
          // Existing required validation
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
      } else {
        // For 'dross', make it required again
        acc[spec.name] = Yup.object({
          target: Yup.string().required('Target is required'),
          min: Yup.string().required('Minimum is required'),
          max: Yup.string().required('Maximum is required'),
        });
      }
      return acc;
    }, {})
  ),
});

function AddProduct() {
  const navigate = useNavigate();

  // State for handling success and error messages
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  // Formik form handling
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSuccess('');
      setError('');

      const { sku, revision, packingInstructions, perBoxAmount, specifications } = values;

      try {
        // Reference to the product document
        const productRef = doc(db, 'products', sku);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          // If product doesn't exist, create it
          await setDoc(productRef, {
            createdAt: new Date(),
          });
        }

        // Reference to the revision document within the revisions subcollection
        const revisionRef = doc(db, 'products', sku, 'revisions', revision);
        const revisionSnap = await getDoc(revisionRef);

        if (revisionSnap.exists()) {
          setError(
            'A revision with this name already exists for this product.'
          );
          return;
        }

        // Transform specifications to desired structure
        const transformedSpecifications = specificationsList.reduce(
          (acc, spec) => {
            acc[spec.name] = {
              target:
                spec.type === 'number' &&
                specifications[spec.name].target !== ''
                  ? Number(specifications[spec.name].target)
                  : specifications[spec.name].target,
              min:
                spec.type === 'number' && specifications[spec.name].min !== ''
                  ? Number(specifications[spec.name].min)
                  : specifications[spec.name].min,
              max:
                spec.type === 'number' && specifications[spec.name].max !== ''
                  ? Number(specifications[spec.name].max)
                  : specifications[spec.name].max,
            };
            return acc;
          },
          {}
        );

        // Create a new revision document with specifications, packing instructions, and per box amount
        await setDoc(revisionRef, {
          specifications: transformedSpecifications,
          packingInstructions,
          perBoxAmount:
            perBoxAmount !== '' ? Number(perBoxAmount) : perBoxAmount,
          createdAt: new Date(),
        });

        setSuccess('Product revision added successfully!');
        resetForm();

        // Optionally, redirect to another page after a delay
        setTimeout(() => {
          navigate('/add-product'); // Redirect to the same page or another as needed
        }, 2000);
      } catch (err) {
        console.error('Error adding product revision: ', err);
        setError('Failed to add product revision. Please try again.');
      }
    },
  });

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add Product Specifications
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
          {/* SKU */}
          <TextField
            label="SKU"
            variant="outlined"
            fullWidth
            required
            name="sku"
            value={formik.values.sku}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.sku && Boolean(formik.errors.sku)}
            helperText={formik.touched.sku && formik.errors.sku}
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

          {/* Packing Instructions */}
          <TextField
            label="Packing Instructions"
            variant="outlined"
            fullWidth
            required
            name="packingInstructions"
            value={formik.values.packingInstructions}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.packingInstructions &&
              Boolean(formik.errors.packingInstructions)
            }
            helperText={
              formik.touched.packingInstructions && formik.errors.packingInstructions
            }
            margin="normal"
          />

          {/* Per Box Amount */}
          <TextField
            label="Per Box Amount"
            variant="outlined"
            fullWidth
            required
            name="perBoxAmount"
            type="number"
            value={formik.values.perBoxAmount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.perBoxAmount &&
              Boolean(formik.errors.perBoxAmount)
            }
            helperText={
              formik.touched.perBoxAmount && formik.errors.perBoxAmount
            }
            margin="normal"
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
                      Boolean(formik.errors.specifications?.[spec.name]?.target)
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

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
          >
            Save Specifications
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default AddProduct;
