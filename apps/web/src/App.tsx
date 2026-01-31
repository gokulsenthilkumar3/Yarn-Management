import './styles.css';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import QualityControlPage from './pages/QualityControlPage';
import QualityAnalyticsDashboard from './pages/QualityAnalyticsDashboard';
import SupplierLayout from './layouts/SupplierLayout';
import SupplierDashboard from './pages/portal/SupplierDashboard';
import SupplierOrderList from './pages/portal/SupplierOrderList';
import SupplierOrderDetail from './pages/portal/SupplierOrderDetail';
import ProductionPlanningPage from './pages/ProductionPlanningPage';
import WorkOrderPage from './pages/WorkOrderPage';
import ShiftManagementPage from './pages/ShiftManagementPage';
import MachineManagementPage from './pages/MachineManagementPage';
import WarehousePage from './pages/WarehousePage';
import WarehouseDetailsPage from './pages/WarehouseDetailsPage';
import StockTransferPage from './pages/StockTransferPage';
import StockMovementPage from './pages/StockMovementPage';
import ScannerPage from './pages/ScannerPage';
import InventoryOptimizationPage from './pages/InventoryOptimizationPage';
import InventoryReconciliationPage from './pages/InventoryReconciliationPage';
import ReconciliationWorkspacePage from './pages/ReconciliationWorkspacePage';
import AccountsReceivablePage from './pages/finance/AccountsReceivablePage';
import CustomerLedgerPage from './pages/finance/CustomerLedgerPage';
import AccountsPayablePage from './pages/finance/AccountsPayablePage';
import VendorLedgerPage from './pages/finance/VendorLedgerPage';
import DemandForecastingPage from './pages/DemandForecastingPage';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/billing/print/:id" element={<InvoicePrintPage />} />

          {/* Main App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              <Route path="/production-planning" element={<ProductionPlanningPage />} />
              <Route path="/work-orders" element={<WorkOrderPage />} />
              <Route path="/shifts" element={<ShiftManagementPage />} />
              <Route path="/machines" element={<MachineManagementPage />} />
              <Route path="/manufacturing" element={<ManufacturingPage />} />
              <Route path="/demand-forecasting" element={<DemandForecastingPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/wastage" element={<WastagePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/warehouse" element={<WarehousePage />} />
              <Route path="/warehouse/warehouses/:id" element={<WarehouseDetailsPage />} />
              <Route path="/warehouse/transfer" element={<StockTransferPage />} />
              <Route path="/warehouse/movements" element={<StockMovementPage />} />
              <Route path="/warehouse/scanner" element={<ScannerPage />} />
              <Route path="/warehouse/optimization" element={<InventoryOptimizationPage />} />
              <Route path="/warehouse/reconciliation" element={<InventoryReconciliationPage />} />
              <Route path="/warehouse/reconciliation/:id" element={<ReconciliationWorkspacePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/finance/ar" element={<AccountsReceivablePage />} />
              <Route path="/finance/ledger/:customerId" element={<CustomerLedgerPage />} />
              <Route path="/finance/ap" element={<AccountsPayablePage />} />
              <Route path="/finance/ap/ledger/:supplierId" element={<VendorLedgerPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/quality-control" element={<QualityControlPage />} />
              <Route path="/quality-analytics" element={<QualityAnalyticsDashboard />} />
            </Route>
          </Route>

          {/* Supplier Portal Routes */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <SupplierLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SupplierDashboard />} />
            <Route path="orders" element={<SupplierOrderList />} />
            <Route path="orders/:id" element={<SupplierOrderDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}
