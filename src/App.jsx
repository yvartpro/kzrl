import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CashExpenses from './pages/CashExpenses';
import Login from './pages/Login';
import Users from './pages/Users';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="sales" element={<Sales />} />
              <Route path="cash-expenses" element={<CashExpenses />} />
              <Route path="reports" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="/unauthorized" element={
              <div className="h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-4xl font-bold text-red-500">403 - Non autorisé</h1>
                <p>Vous n'avez pas les permissions pour accéder à cette page.</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Retour au tableau de bord
                </button>
              </div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;