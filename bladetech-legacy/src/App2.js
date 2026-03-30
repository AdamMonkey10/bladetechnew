// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import MilwaukeeTestForm from './components/MilwaukeeTestForm';
import ReportTable from './components/ReportTable';
import ReportDetails from './components/ReportDetails';
import Analysis from './components/Analysis'; // Existing Route
import AddProduct from './components/AddProduct'; // New Route
import ShiftForm from './components/ShiftForm'; // Updated ShiftForm Route
import ShiftAnalysis from './components/ShiftAnalysis'; // New ShiftAnalysis Route
import CalibrationForm from './components/CalibrationForm.js'; // 
import CalibrationReportTable from './components/CalibrationReportTable.js'; //
import PdfCatalog from './components/PdfCatalog'; //
import CalibrationDetail from './components/CalibrationDetail.js'; // 
import './styles.css'; // Ensure styles are correctly imported

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginLeft: { md: '240px' }, // Width of the drawer
            marginTop: { xs: '64px', md: 0 }, // AppBar height on mobile
          }}
        >
          <Toolbar /> {/* Ensures content is below AppBar on mobile */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/milwaukee-test-form" element={<MilwaukeeTestForm />} />
            <Route path="/reports" element={<ReportTable />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/analysis" element={<Analysis />} /> {/* Existing Route */}
            <Route path="/add-product" element={<AddProduct />} /> {/* New Route */}
            <Route path="/shiftform" element={<ShiftForm />} /> {/* Updated ShiftForm Route */}
            <Route path="/shift-analysis" element={<ShiftAnalysis />} /> {/* New ShiftAnalysis Route */}
            <Route path="/CalibrationForm" element={<CalibrationForm />} /> {/* CalibrationForm */}
            <Route path="/CalibrationReportTable" element={<CalibrationReportTable />} /> {/* CalibrationForm */}
            <Route path="/PdfCatalog" element={<PdfCatalog />} /> {/* CalibrationForm */}
            <Route path="/calibrations/:id" element={<CalibrationDetail />} />
            {/* Add other routes here */}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
