import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import DeliveryAgents from './pages/DeliveryAgents';
import Inventory from './pages/Inventory';
import BulkInventory from './pages/BulkInventory';
import PurchaseManagement from './pages/PurchaseManagement';
import InventoryAdjustments from './pages/InventoryAdjustments';
import ProfitAnalysis from './pages/ProfitAnalysis';
import Stores from './pages/Stores';
import Coupons from './pages/Coupons';
import Banners from './pages/Banners';
import Payments from './pages/Payments';
import Refunds from './pages/Refunds';
import Ratings from './pages/Ratings';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import SupportTickets from './pages/SupportTickets';
import CreateServiceTicket from './pages/CreateServiceTicket';
import LoadingSpinner from './components/UI/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load user profile</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/delivery-agents" element={<DeliveryAgents />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/bulk-inventory" element={<BulkInventory />} />
        <Route
          path="/purchase-management"
          element={
            <ProtectedRoute permission="purchase_management">
              <PurchaseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory-adjustments"
          element={
            <ProtectedRoute permission="inventory_adjustments">
              <InventoryAdjustments />
            </ProtectedRoute>
          }
        />
        <Route path="/stores" element={<Stores />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/banners" element={<Banners />} />
        <Route
          path="/payments"
          element={
            <ProtectedRoute permission="view_payments">
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute permission="manage_refunds">
              <Refunds />
            </ProtectedRoute>
          }
        />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/support-tickets" element={<SupportTickets />} />
        <Route
          path="/create-service-ticket"
          element={
            <ProtectedRoute permission="manage_support_tickets">
              <CreateServiceTicket />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<div className="p-6">Notifications - Coming Soon</div>} />
        <Route path="/analytics" element={<Analytics />} />
        <Route
          path="/profit-analysis"
          element={
            <ProtectedRoute permission="view_profit_analysis">
              <ProfitAnalysis />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;