// src/contexts/CalibrationContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';

// Create the context
export const CalibrationContext = createContext();

// Utility functions moved outside the component for stability
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

// Create the provider component
export const CalibrationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calibrationData, setCalibrationData] = useState(null); // To store any data you might want to pass

  // Function to open the popup
  const openPopup = useCallback((data = null) => {
    setCalibrationData(data);
    setIsOpen(true);
  }, []);

  // Function to close the popup
  const closePopup = useCallback(() => {
    setIsOpen(false);
    setCalibrationData(null);
  }, []);

  // Function to check if the popup should be shown automatically
  const checkAutomaticTrigger = useCallback(() => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const hour = now.getHours();

    // Check if today is Monday and time is 9 AM or later
    if (day === 1 && hour >= 9) {
      const weeklyKey = getWeeklyKey();
      const hasAcknowledged = localStorage.getItem(weeklyKey);

      if (!hasAcknowledged) {
        openPopup(); // Automatically open the popup
      }
    }
  }, [openPopup]); // Now, getWeeklyKey is stable and can be safely omitted

  useEffect(() => {
    // Run the check on component mount
    checkAutomaticTrigger();

    // Optionally, set an interval to check periodically (e.g., every hour)
    const interval = setInterval(() => {
      checkAutomaticTrigger();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval); // Cleanup on unmount
  }, [checkAutomaticTrigger]);

  return (
    <CalibrationContext.Provider
      value={{
        isOpen,
        openPopup,
        closePopup,
        calibrationData,
        setCalibrationData,
      }}
    >
      {children}
    </CalibrationContext.Provider>
  );
};
