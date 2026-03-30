// src/Login.js

import React, { useState } from 'react';
import { loginUser, resetPassword } from './authService'; // Ensure correct import paths
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

const Login = () => {
  // State variables for login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State variables for error messages
  const [errorMessage, setErrorMessage] = useState('');

  // State variables for password reset modal
  const [openResetModal, setOpenResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const navigate = useNavigate();

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      // Attempt to sign in
      await loginUser(email, password);

      // Redirect to home page after successful login
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'An error occurred during login. Please try again.');
    }
  };

  // Handle opening the password reset modal
  const handleOpenResetModal = () => {
    setOpenResetModal(true);
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
  };

  // Handle closing the password reset modal
  const handleCloseResetModal = () => {
    setOpenResetModal(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
  };

  // Handle password reset form submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    try {
      await resetPassword(resetEmail);
      setResetSuccess('Password reset email sent successfully. Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError(error.message || 'Failed to send password reset email. Please try again.');
    }
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Left side image or background color */}
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(/images/login-background.jpg)', // Optional: Add a background image
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light'
              ? t.palette.grey[50]
              : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Right side login form */}
      <Grid
        item
        xs={12}
        sm={8}
        md={5}
        component={Paper}
        elevation={6}
        square
      >
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Company Logo */}
          <img
            src="/images/BT.jpg"
            alt="Company Logo"
            style={{ width: '150px', marginBottom: '20px' }}
          />
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
          {/* Login Form */}
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 1 }}
          >
            {/* Display error message if login fails */}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            {/* Email Input */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            {/* Password Input */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleOpenResetModal}
              >
                Forgot password?
              </Link>
            </Box>
            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Password Reset Modal */}
      <Dialog
        open={openResetModal}
        onClose={handleCloseResetModal}
        aria-labelledby="password-reset-dialog-title"
        aria-describedby="password-reset-dialog-description"
      >
        <DialogTitle id="password-reset-dialog-title">Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText id="password-reset-dialog-description">
            Enter your email address below, and we'll send you a link to reset your password.
          </DialogContentText>
          <Box
            component="form"
            noValidate
            onSubmit={handleResetPassword}
            sx={{ mt: 2 }}
          >
            {/* Display error message if reset fails */}
            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {resetError}
              </Alert>
            )}
            {/* Display success message if reset email is sent */}
            {resetSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {resetSuccess}
              </Alert>
            )}
            {/* Email Input for Password Reset */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="resetEmail"
              label="Email Address"
              name="resetEmail"
              autoComplete="email"
              autoFocus
              variant="outlined"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            {/* Password Reset Buttons */}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={handleCloseResetModal} color="secondary">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!resetEmail}
              >
                Send Reset Email
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

export default Login;
