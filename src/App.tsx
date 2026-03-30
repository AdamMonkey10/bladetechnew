import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createOptimizedQueryClient } from "@/utils/queryDeduplication";

import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DeviceGate } from "@/components/DeviceGate";
import { AppHeader } from "@/components/layout/AppHeader";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import QCTest from "./pages/QCTest";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import GoodsIn from "./pages/GoodsIn";
import Calibration from "./pages/Calibration";
import CustomerPO from "./pages/CustomerPO";
import CustomerManagement from "./pages/CustomerManagement";
import SupplierQC from "./pages/SupplierQC";

import Shifts from "./pages/Shifts";
import OperatorTimesheet from "./pages/OperatorTimesheet";
import LabelPrinting from "./pages/LabelPrinting";
import ManualLabelPrinting from "./pages/ManualLabelPrinting";
import AdvancedLabelPrinting from "./pages/AdvancedLabelPrinting";
import Analytics from "./pages/Analytics";
import OEE from "./pages/OEE";

import Operators from "./pages/Operators";
import Boxes from "./pages/Boxes";
import PalletManagement from "./pages/PalletManagement";
import SKUManagement from "./pages/SKUManagement";
import Settings from "./pages/Settings";
import WeeklyReports from "./pages/WeeklyReports";
import ClockfyIntegration from "./pages/ClockfyIntegration";
import WebhookTester from "./pages/WebhookTester";
import OverdueTimesheets from "./pages/OverdueTimesheets";
import TimesheetManagement from "./pages/TimesheetManagement";
import TimesheetReports from "./pages/TimesheetReports";
import WeeklyBreakdownPage from "./pages/WeeklyBreakdown";
import ProductionCharts from "./pages/ProductionCharts";
import DeviceManagement from "./pages/DeviceManagement";
import Backups from "./pages/Backups";

// Lazy import warehouse module if enabled
import { isWarehouseEnabled, registerWarehouseRoute } from './features/warehouse';

// Create query client with optimized configuration for maximum performance
const queryClient = createOptimizedQueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DeviceGate>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-background">
                    <AppHeader />
                    <main className="p-4 lg:p-6">
                      <Outlet />
                    </main>
                  </div>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/qc-test" element={<QCTest />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/goods-in" element={<GoodsIn />} />
              <Route path="/calibration" element={<Calibration />} />
              <Route path="/customer-po" element={<CustomerPO />} />
              <Route path="/customer" element={<SupplierQC />} />
              <Route path="/customer-management" element={<CustomerManagement />} />
              <Route path="/shifts" element={<Shifts />} />
              <Route path="/shifts/:operatorCode" element={<OperatorTimesheet />} />
              <Route path="/shifts/:operatorCode/:date" element={<OperatorTimesheet />} />
              <Route path="/label-printing" element={<LabelPrinting />} />
              <Route path="/manual-label-printing" element={<ManualLabelPrinting />} />
              <Route path="/advanced-label-printing" element={<AdvancedLabelPrinting />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/oee" element={<OEE />} />
              
              <Route path="/operators" element={<Operators />} />
              <Route path="/boxes" element={<Boxes />} />
              <Route path="/pallet-management" element={<PalletManagement />} />
              <Route path="/sku-management" element={<SKUManagement />} />
              <Route path="/weekly-reports" element={<Navigate to="/reports" replace />} />
              <Route path="/timesheet-reports" element={<Navigate to="/reports" replace />} />
              <Route path="/clockfy-integration" element={<ClockfyIntegration />} />
              <Route path="/webhook-tester" element={<WebhookTester />} />
              <Route path="/overdue-timesheets" element={<OverdueTimesheets />} />
              <Route path="/timesheet-management" element={<TimesheetManagement />} />
              <Route path="/weekly-breakdown" element={<WeeklyBreakdownPage />} />
              <Route path="/production-charts" element={<ProductionCharts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/device-management" element={<DeviceManagement />} />
              <Route path="/backups" element={<Backups />} />
              {/* Conditionally register warehouse route */}
              {isWarehouseEnabled() && <Route {...registerWarehouseRoute()} />}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </DeviceGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
