import React, { Suspense } from 'react';
import { HashRouter, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages - Lazy loading para mejor rendimiento
const LoginPage = React.lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
const ProductsPage = React.lazy(() => import('./pages/Products/ProductsPage'));
const POSPage = React.lazy(() => import('./pages/POS/POSPage'));
const CustomersPage = React.lazy(() => import('./pages/Customers/CustomersPage'));
const InvoicesPage = React.lazy(() => import('./pages/Invoices/InvoicesPage'));
const ReportsPage = React.lazy(() => import('./pages/Reports/ReportsPage'));
const SalesByProductPage = React.lazy(() => import('./pages/Reports/SalesByProductPage'));
const TopCustomersPage = React.lazy(() => import('./pages/Reports/TopCustomersPage'));
const CustomerPurchasesPage = React.lazy(() => import('./pages/Reports/CustomerPurchasesPage'));
const InventoryReportPage = React.lazy(() => import('./pages/Reports/InventoryReportPage'));
const CashMovementsPage = React.lazy(() => import('./pages/Reports/CashMovementsPage'));
const SettingsPage = React.lazy(() => import('./pages/Settings/SettingsPage'));
const SuppliersPage = React.lazy(() => import('./pages/Suppliers/SuppliersPage'));
const PurchasesPage = React.lazy(() => import('./pages/Purchases/PurchasesPage'));
const NewPurchasePage = React.lazy(() => import('./pages/Purchases/NewPurchasePage'));
const InventoryPage = React.lazy(() => import('./pages/Inventory/InventoryPage'));
const AccountingPage = React.lazy(() => import('./pages/Accounting/AccountingPage'));
const UsersPage = React.lazy(() => import('./pages/Users/UsersPage'));
const CajaPage = React.lazy(() => import('./pages/Caja/CajaPage'));
const StockAdjustmentsPage = React.lazy(() => import('./pages/Inventory/StockAdjustmentsPage'));
const CreditNotesPage = React.lazy(() => import('./pages/Invoices/CreditNotesPage'));
const CotizacionesPage = React.lazy(() => import('./pages/Cotizaciones/CotizacionesPage'));
const WorkstationsPage = React.lazy(() => import('./pages/Caja/WorkstationsPage'));
const AuditPage = React.lazy(() => import('./pages/Reports/AuditPage'));

// Lógica para detectar si es Electron o Navegador (Evita la pantalla azul)
const isElectron = navigator.userAgent.toLowerCase().includes(' electron');
const Router = isElectron ? HashRouter : BrowserRouter;

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner text="Cargando aplicación..." />}>
            <Routes>
              {/* Ruta Pública */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Rutas Privadas (Protegidas) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                {/* Redirección inicial al entrar al sistema */}
                <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Módulos del Sistema */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="clientes" element={<CustomersPage />} />
            <Route path="facturas" element={<InvoicesPage />} />
            <Route path="cotizaciones" element={<CotizacionesPage />} />
            <Route path="proveedores" element={<SuppliersPage />} />
            <Route path="compras" element={<PurchasesPage />} />
            <Route path="compras/nueva" element={<NewPurchasePage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="contabilidad" element={<AccountingPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="reportes/ventas-producto" element={<SalesByProductPage />} />
            <Route path="reportes/clientes-top" element={<TopCustomersPage />} />
            <Route path="reportes/compras-cliente" element={<CustomerPurchasesPage />} />
            <Route path="reportes/inventario" element={<InventoryReportPage />} />
            <Route path="reportes/movimientos-caja" element={<CashMovementsPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="caja" element={<CajaPage />} />
            <Route path="auditoria" element={
               <ProtectedRoute role="admin">
                  <AuditPage />
               </ProtectedRoute>
            } />
            <Route path="ajustes-stock" element={<StockAdjustmentsPage />} />
            <Route path="notas-credito" element={<CreditNotesPage />} />
            <Route path="estaciones" element={
               <ProtectedRoute role="admin">
                  <WorkstationsPage />
               </ProtectedRoute>
            } />
            <Route path="config" element={
              <ProtectedRoute role="admin">
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>

              {/* Captura cualquier otra ruta y manda al inicio */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;