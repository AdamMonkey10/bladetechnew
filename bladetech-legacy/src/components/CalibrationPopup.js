// src/components/CalibrationPopup.js

import React, { useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { CalibrationContext } from '../contexts/CalibrationContext';
import { db } from '../firebase'; // Ensure Firebase is correctly configured
import { Timestamp, addDoc, collection } from 'firebase/firestore';

const CalibrationPopup = () => {
  const { isOpen, closePopup } = useContext(CalibrationContext); // Removed calibrationData

  const handleAcknowledge = async () => {
    // Save acknowledgment in localStorage
    const weeklyKey = getWeeklyKey();
    localStorage.setItem(weeklyKey, 'acknowledged');

    // Optionally, save acknowledgment to Firebase
    try {
      await addDoc(collection(db, 'calibrationAcknowledgments'), {
        acknowledgedAt: Timestamp.now(),
        // Add more fields if necessary, e.g., user ID
      });
    } catch (error) {
      console.error('Error saving calibration acknowledgment:', error);
      // Optionally, handle the error (e.g., show a notification)
    }

    closePopup();
  };

  const handleRemindLater = () => {
    // Simply close the popup without saving acknowledgment
    closePopup();
  };

  // Utility functions to match the context's
  const getStartOfWeek = (date) => {
    const day = date.getDay(); // Sunday - Saturday : 0 - 6
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  };

  const getWeeklyKey = () => {
    const today = new Date();
    const startOfWeek = getStartOfWeek(new Date(today));
    const year = startOfWeek.getFullYear();
    const week = getWeekNumber(startOfWeek);
    return `calibration_${year}_W${week}`;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleRemindLater}
      aria-labelledby="calibration-popup-title"
      aria-describedby="calibration-popup-description"
    >
      <DialogTitle id="calibration-popup-title">
        Weekly Block Calibration Reminder
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="calibration-popup-description">
          It's Monday 9 AM. Please perform the weekly block calibration to ensure
          all measurements are accurate and reliable.
        </DialogContentText>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Regular calibration helps maintain the integrity of your measurement
          tools and ensures consistent results.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleRemindLater} color="secondary">
          Remind Me Later
        </Button>
        <Button onClick={handleAcknowledge} color="primary" autoFocus>
          Acknowledge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalibrationPopup;
