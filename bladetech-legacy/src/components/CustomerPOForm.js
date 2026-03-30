import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CustomerPOForm = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [skusError, setSkusError] = useState('');

  const initialValues = {
    customer: '',
    po: '',
    sku: '',
    quantity: '', // user might type "0900" here
  };

  const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Customer is required'),
    po: Yup.string().required('Customer PO is required'),
    sku: Yup.string().required('SKU is required'),
    quantity: Yup.number()
      .required('Quantity is required')
      .min(1, 'Quantity must be at least 1'),
  });

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const skusCollection = collection(db, 'products');
        const snapshot = await getDocs(skusCollection);
        const skuList = snapshot.docs.map((doc) => doc.id);
        setSkuOptions(skuList);
      } catch (err) {
        console.error('Error fetching SKUs:', err);
        setSkusError('Failed to load SKUs.');
      } finally {
        setLoadingSkus(false);
      }
    };
    fetchSkus();
  }, []);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Force quantity to a number
      const numericQuantity = parseInt(values.quantity, 10);

      await addDoc(collection(db, 'CustomerPurchaseOrders'), {
        customer: values.customer,
        po: values.po,
        sku: values.sku,
        quantity: numericQuantity,  // <--- store as a number
        createdAt: serverTimestamp(),
        status: false,
      });

      setSuccess('Customer PO saved successfully.');
      resetForm();
    } catch (err) {
      console.error('Error saving Customer PO:', err);
      setError('Failed to save Customer PO.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Customer Purchase Order
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                id="customer"
                name="customer"
                label="Customer"
                value={values.customer}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.customer && Boolean(errors.customer)}
                helperText={touched.customer && errors.customer}
                margin="normal"
              />

              <TextField
                fullWidth
                id="po"
                name="po"
                label="Customer PO"
                value={values.po}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.po && Boolean(errors.po)}
                helperText={touched.po && errors.po}
                margin="normal"
              />

              <FormControl
                fullWidth
                margin="normal"
                error={touched.sku && Boolean(errors.sku)}
              >
                <InputLabel id="sku-label">SKU</InputLabel>
                <Select
                  labelId="sku-label"
                  id="sku"
                  name="sku"
                  value={values.sku}
                  label="SKU"
                  onChange={handleChange}
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
                  ) : (
                    skuOptions.map((sku) => (
                      <MenuItem key={sku} value={sku}>
                        {sku}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {touched.sku && errors.sku && (
                  <FormHelperText error>{errors.sku}</FormHelperText>
                )}
                {skusError && <FormHelperText error>{skusError}</FormHelperText>}
              </FormControl>

              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Quantity"
                type="number"
                value={values.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.quantity && Boolean(errors.quantity)}
                helperText={touched.quantity && errors.quantity}
                margin="normal"
              />
            </Box>

            <Button color="primary" variant="contained" fullWidth type="submit">
              Save Customer PO
            </Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default CustomerPOForm;
