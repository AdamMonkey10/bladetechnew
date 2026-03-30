// src/components/Home.js

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Stack,
  Alert,
  Grid, // Keep using Grid if Grid2 isn't available
} from '@mui/material';
import { Assignment, Assessment } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import backgroundLogo from '../images/logo2.png';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Import CalibrationContext
import { CalibrationContext } from '../contexts/CalibrationContext';

function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latestVersion, setLatestVersion] = useState(null);
  const [formInfo, setFormInfo] = useState('');
  const [loadingVersion, setLoadingVersion] = useState(true);
  const [versionError, setVersionError] = useState('');

  const currentVersion = 17; // Current version set

  // Access the calibration context
  const { openPopup } = useContext(CalibrationContext);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Fetch the latest version and form info from Firestore
  useEffect(() => {
    const fetchLatestVersion = async () => {
      setLoadingVersion(true);
      setVersionError('');
      try {
        const latestVersionDocRef = doc(db, 'Rev', 'latestversion');
        const latestVersionDoc = await getDoc(latestVersionDocRef);

        if (!latestVersionDoc.exists()) {
          setVersionError('Version information not found.');
          setLatestVersion(null);
          return;
        }

        const versionData = latestVersionDoc.data();
        const fetchedVersion = versionData.version;
        const fetchedFormInfo = versionData.Form;

        if (typeof fetchedVersion !== 'number') {
          setVersionError('Invalid version format in Firestore.');
          setLatestVersion(null);
          return;
        }

        setLatestVersion(fetchedVersion);
        setFormInfo(fetchedFormInfo || '');
      } catch (err) {
        console.error('Error fetching latest version:', err);
        setVersionError('Failed to load version information.');
        setLatestVersion(null);
      } finally {
        setLoadingVersion(false);
      }
    };

    fetchLatestVersion();
  }, []);

  const isUpdateNeeded = latestVersion !== null && latestVersion > currentVersion;

  // Automatically trigger the popup on component mount if update is needed
  useEffect(() => {
    if (isUpdateNeeded) {
      const additionalData = {
        triggeredBy: 'Automatic Trigger on Home Load',
        timestamp: new Date(),
        userId: 'user_12345', // Replace with dynamic user ID if available
        additionalAction: 'Prompt Update',
      };
      openPopup(additionalData);
    }
  }, [isUpdateNeeded, openPopup]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        backgroundImage: `url(${backgroundLogo})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 1,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          opacity: 0.8,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', paddingTop: '20px', zIndex: 2 }}>
        <Grid container spacing={2} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 12, mt: 2 }}>
          <Grid item>
            <Box sx={{ mt: -5.5 }}>
              <img
                src="/images/BT.jpg"
                alt="Bladetech Logo"
                style={{
                  maxWidth: '350px',
                  width: '150%',
                  height: 'auto',
                }}
              />
            </Box>
          </Grid>

          {/* Display Form Info */}
          {formInfo && (
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: '#333' }}>
                  {formInfo}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item>
            <Box
              sx={{
                backgroundColor: '#ffffff',
                color: '#4eb857',
                padding: '6px 12px',
                borderRadius: '6px',
                boxShadow: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '140px',
                mt: { xs: 2, sm: -1 },
              }}
            >
              <Typography variant="subtitle1" align="center" fontWeight="bold">
                {formatTime(currentTime)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography
            variant="h4"
            component="p"
            gutterBottom
            align="center"
            sx={{ color: '#000000' }}
          >
            BLADETECH DASHBOARD
          </Typography>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Stack
              spacing={3}
              direction="row"
              sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <Button
                component={Link}
                to="/milwaukee-test-form"
                variant="contained"
                startIcon={<Assignment />}
                sx={{
                  backgroundColor: '#4eb857',
                  color: '#ffffff',
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: '250px',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  '&:hover': {
                    backgroundColor: '#3da34a',
                  },
                }}
              >
                Test Form
              </Button>

              <Button
                component={Link}
                to="/Shiftform"
                variant="outlined"
                startIcon={<Assessment />}
                sx={{
                  borderColor: '#4eb857',
                  color: '#4eb857',
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: '250px',
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  '&:hover': {
                    borderColor: '#3da34a',
                    color: '#3da34a',
                  },
                }}
              >
                Time Sheet
              </Button>
            </Stack>
          </Box>

          {/* Removed the Trigger Calibration Button */}

          <Box
            sx={{
              mt: 6,
              mb: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#000000', mb: 2, fontSize: '1rem' }}
              >
                Scan the QR code to access our app:
              </Typography>
              <QRCodeSVG
                value="https://bladetech-data.web.app/"
                size={100}
                bgColor="#ffffff"
                fgColor="#4eb857"
                includeMargin={true}
                aria-label="QR code linking to Bladetech app"
              />
            </Box>
          </Box>
        </Box>
      </Container>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: '#f0f0f0',
          padding: '12px 0',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  backgroundColor: '#4eb857',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Current Revision
                </Typography>
                <Typography variant="body1">
                  Rev {currentVersion}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  backgroundColor: '#1976d2',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Latest Version
                </Typography>
                <Typography variant="body1">
                  {loadingVersion
                    ? 'Loading...'
                    : latestVersion !== null
                    ? `Rev ${latestVersion}`
                    : 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              {isUpdateNeeded && (
                <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                  A new version (Rev {latestVersion}) is available. Please update the application.
                </Alert>
              )}
              {versionError && (
                <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
                  {versionError}
                </Alert>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
