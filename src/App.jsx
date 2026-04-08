import React from 'react';
import { HashRouter, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages - Importaciones verificadas
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import POSPage from './pages/POS/POSPage';
import CustomersPage from './pages/Customers/CustomersPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SuppliersPage from './pages/Suppliers/SuppliersPage';
import PurchasesPage from './pages/Purchases/PurchasesPage';
import NewPurchasePage from './pages/Purchases/NewPurchasePage';
import InventoryPage from './pages/Inventory/InventoryPage';
import AccountingPage from './pages/Accounting/AccountingPage';
import UsersPage from './pages/Users/UsersPage';
import CajaPage from './pages/Caja/CajaPage';
import NCFPage from './pages/Settings/NCFPage';

// Lógica para detectar si es Electron o Navegador (Evita la pantalla azul)
const isElectron = navigator.userAgent.toLowerCase().includes(' electron');
const Router = isElectron ? HashRouter : BrowserRouter;

function App() {
  return (
    <AuthProvider>
      <Router>
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
            <Route path="proveedores" element={<SuppliersPage />} />
            <Route path="compras" element={<PurchasesPage />} />
            <Route path="compras/nueva" element={<NewPurchasePage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="contabilidad" element={<AccountingPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="caja" element={<CajaPage />} />
            <Route path="ncf" element={
              <ProtectedRoute role="admin">
                <NCFPage />
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
      </Router>
    </AuthProvider>
  );
}

export default App;