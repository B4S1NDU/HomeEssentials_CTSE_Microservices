import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

export default function App() {
  const { token } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Routes>
        <Route path="/login"    element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/products"           element={<ProductsPage />} />
          <Route path="/products/new"       element={<ProductFormPage />} />
          <Route path="/products/:id/edit"  element={<ProductFormPage />} />
          <Route path="/inventory"          element={<InventoryPage />} />
          <Route path="/orders"             element={<OrdersPage />} />
          <Route path="/payments"           element={<PaymentsPage />} />
          <Route path="/notifications"      element={<NotificationsPage />} />
        </Route>

        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </div>
  );
}
