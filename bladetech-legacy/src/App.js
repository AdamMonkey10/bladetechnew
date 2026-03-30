// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import MilwaukeeTestForm from './components/MilwaukeeTestForm';
import ReportTable from './components/ReportTable';
import ReportDetails from './components/ReportDetails';
import Analysis from './components/Analysis';
import AddProduct from './components/AddProduct';
import ShiftForm from './components/ShiftForm';
import ShiftAnalysis from './components/ShiftAnalysis';
import CalibrationForm from './components/CalibrationForm';
import CalibrationReportTable from './components/CalibrationReportTable';
import PdfCatalog from './components/PdfCatalog';
import CalibrationDetail from './components/CalibrationDetail';
import Login from './Login';
import { AuthProvider } from './AuthProvider';
import PrivateRoute from './PrivateRoute';
import GoodsInForm from './components/GoodsInForm';
import StockTable from './components/StockTable';
import AddRawMaterial from './components/AddRawMaterial';
import CompareMachines from './components/CompareMachines';
import BlockCalibrationForm from './components/BlockCalibrationForm';
import BlockCalibrationReportTable from './components/BlockCalibrationReportTable';
import LabelPrinting from './components/LabelPrinting';
import CustomerPOForm from './components/CustomerPOForm';
import PrintedBoxesRecord from './components/PrintedBoxesRecord';
import CustomerPOList from './components/CustomerPOList'; // <-- NEW IMPORT
import { Helmet } from 'react-helmet';
import './styles.css';
import { CalibrationProvider } from './contexts/CalibrationContext';
import CalibrationPopup from './components/CalibrationPopup';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CalibrationProvider>
          <Helmet>
            <title>BladeTech</title>
          </Helmet>
          <CalibrationPopup />
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              {/* Layout Route with Sidebar */}
              <Route
                element={
                  <Box sx={{ display: 'flex' }}>
                    <Sidebar />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        marginLeft: { md: '280px' },
                        marginTop: { xs: '64px', md: 0 },
                      }}
                    >
                      <Toolbar />
                      <Outlet />
                    </Box>
                  </Box>
                }
              >
                {/* Redirect root to /home */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Protected Routes */}
                <Route path="/home" element={<Home />} />
                <Route path="/goods-in" element={<GoodsInForm />} />
                <Route path="/milwaukee-test-form" element={<MilwaukeeTestForm />} />
                <Route path="/reports" element={<ReportTable />} />
                <Route path="/reports/:id" element={<ReportDetails />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/compare" element={<CompareMachines />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/shiftform" element={<ShiftForm />} />
                <Route path="/shift-analysis" element={<ShiftAnalysis />} />
                <Route path="/CalibrationForm" element={<CalibrationForm />} />
                <Route path="/CalibrationReportTable" element={<CalibrationReportTable />} />
                <Route path="/PdfCatalog" element={<PdfCatalog />} />
                <Route path="/calibrations/:id" element={<CalibrationDetail />} />
                <Route path="/StockTable" element={<StockTable />} />
                <Route path="/AddRawMaterial" element={<AddRawMaterial />} />
                <Route path="/block-calibration-form" element={<BlockCalibrationForm />} />
                <Route path="/block-calibration-reports" element={<BlockCalibrationReportTable />} />
                <Route path="/label-printing" element={<LabelPrinting />} />
                <Route path="/customer-po" element={<CustomerPOForm />} />
                <Route path="/printed-boxes" element={<PrintedBoxesRecord />} />

                {/* NEW: Route for CustomerPOList */}
                <Route path="/customer-po-list" element={<CustomerPOList />} />
              </Route>
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CalibrationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
