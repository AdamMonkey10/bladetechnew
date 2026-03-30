// src/components/NumericTextField.js

import React, { useState } from 'react';
import { Grid, TextField, FormHelperText } from '@mui/material';

function NumericTextField({ label, name, formik, isWithinSpec, isFormDisabled }) {
  const withinSpec = isWithinSpec(name);

  // Determine background color based on specification status
  let backgroundColor = '';
  if (withinSpec === false) {
    backgroundColor = '#ffcccc'; // Light red
  } else if (withinSpec === true) {
    backgroundColor = '#ccffcc'; // Light green
  }

  // State for warning message
  const [warning, setWarning] = useState('');

  // Function to format the number to exactly four decimal places on blur
  const handleBlur = (e) => {
    formik.handleBlur(e);
    const value = formik.values[name];
    if (value !== '' && !isNaN(value)) {
      const numValue = parseFloat(value);
      const formattedValue = numValue.toFixed(4);
      formik.setFieldValue(name, formattedValue);
      setWarning('');
    } else {
      setWarning('');
    }
  };

  return (
    <Grid item xs={12} sm={6}>
      <TextField
        label={label}
        name={name}
        type="text" // Changed from "number" to "text"
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={handleBlur}
        fullWidth
        required
        error={formik.touched[name] && Boolean(formik.errors[name])}
        helperText={(formik.touched[name] && formik.errors[name]) || warning}
        disabled={isFormDisabled}
        InputProps={{
          style: {
            backgroundColor: backgroundColor,
          },
          inputProps: {
            inputMode: 'decimal', // Opens numeric keypad with decimal on mobile devices
            pattern: '[0-9.]*', // Ensures numeric input with decimal point
          },
        }}
        variant="outlined"
        placeholder="e.g., 0.8300"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: backgroundColor,
            '& fieldset': {
              borderColor:
                withinSpec === false
                  ? 'red'
                  : withinSpec === true
                  ? 'green'
                  : '',
            },
            '&:hover fieldset': {
              borderColor:
                withinSpec === false
                  ? 'red'
                  : withinSpec === true
                  ? 'green'
                  : '',
            },
            '&.Mui-focused fieldset': {
              borderColor:
                withinSpec === false
                  ? 'red'
                  : withinSpec === true
                  ? 'green'
                  : '',
            },
          },
        }}
      />
      {/* Display within spec s tatus */}
      {withinSpec !== null && (
        <FormHelperText>
          {withinSpec ? 'Within specification' : 'Out of specification'}
        </FormHelperText>
      )}
    </Grid>
  );
}

export default NumericTextField;
