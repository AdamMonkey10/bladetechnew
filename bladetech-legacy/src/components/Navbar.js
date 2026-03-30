// src/components/Navbar.js

import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';

function Navbar() {
  // State to hold current date and time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Effect to update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Format the date and time
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <AppBar position="fixed" className="navbar" sx={{ backgroundColor: '#4eb857' }}>
      <Toolbar>
        {/* Logo */}
        <Box sx={{ flexGrow: 1 }}>
          <img
            src="/images/logo.svg" // Path to your logo in the publicfolder
            alt="Bladetech Logo"
            style={{ maxHeight: '40px' }}
          />
        </Box>

        {/* Date and Time Display */}
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body1" sx={{ color: '#ffffff' }}>
            {formattedDate}
          </Typography>
          <Typography variant="body1" sx={{ color: '#ffffff' }}>
            {formattedTime}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
