import './styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import SupplierDashboard from './components/SupplierDashboard';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InvoicePrintPage from './pages/InvoicePrintPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import ProcurementPage from './pages/ProcurementPage';
import ManufacturingPage from './pages/ManufacturingPage';
import BillingPage from './pages/BillingPage';
import WastagePage from './pages/WastagePage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import { NotificationProvider } from './context/NotificationContext';

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/test-suppliers" element={<SupplierDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/billing/print/:id" element={<InvoicePrintPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              <Route path="/manufacturing" element={<ManufacturingPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/wastage" element={<WastagePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}
