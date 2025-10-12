import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Truck,
  Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { getDashboardStats } from '../lib/supabase';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalCustomers: 0,
    totalAgents: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (err: any) {
      setError(`Failed to load dashboard: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Dashboard Loading Error</CardTitle>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={loadDashboard}>
              Retry Loading Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to Zepta Admin Panel</p>
        </div>
        <Button onClick={loadDashboard} icon={TrendingUp} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-green-600">+{stats.todayOrders} today</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProducts}</p>
                <p className="text-sm text-gray-600">{stats.totalProducts} total</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/orders'}
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              View Orders
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/products'}
            >
              <Package className="h-6 w-6 mb-2" />
              Manage Products
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/delivery-agents'}
            >
              <Truck className="h-6 w-6 mb-2" />
              Delivery Agents
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/stores'}
            >
              <Store className="h-6 w-6 mb-2" />
              Store Management
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/purchase-management'}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              Add Inventory
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/bulk-inventory'}
            >
              <Package className="h-6 w-6 mb-2" />
              Bulk Stock
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/analytics'}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => window.location.href = '/profit-analysis'}
            >
              <CheckCircle className="h-6 w-6 mb-2" />
              Profit Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}