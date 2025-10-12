import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Get orders analytics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());
      
      if (ordersError) throw ordersError;
      
      // Get products analytics
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;
      
      // Get users analytics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .gte('created_at', startDate.toISOString());
      
      if (usersError) throw usersError;
      
      // Calculate analytics
      const totalRevenue = orders
        ?.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (parseFloat(o.order_total) || 0), 0) || 0;
      
      const totalOrders = orders?.length || 0;
      const newCustomers = users?.filter(u => u.role === 'customer').length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      
      // Order status breakdown
      const ordersByStatus = orders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}) || {};
      
      // Daily revenue trend (last 7 days)
      const dailyRevenue = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayOrders = orders?.filter(o => 
          o.status === 'delivered' &&
          new Date(o.created_at) >= dayStart &&
          new Date(o.created_at) <= dayEnd
        ) || [];
        
        const dayRevenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.order_total) || 0), 0);
        
        dailyRevenue.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }
      
      setAnalytics({
        totalRevenue,
        totalOrders,
        newCustomers,
        activeProducts,
        ordersByStatus,
        dailyRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      });
      
    } catch (err) {
      console.error('❌ Analytics loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Analytics Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics}>
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline" onClick={loadAnalytics} disabled={loading} icon={TrendingUp}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{analytics.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600">
                  {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders || 0}</p>
                <p className="text-sm text-blue-600">
                  Avg: ₹{Math.round(analytics.averageOrderValue || 0)}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.newCustomers || 0}</p>
                <p className="text-sm text-purple-600">This period</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeProducts || 0}</p>
                <p className="text-sm text-orange-600">Currently listed</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.dailyRevenue?.map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm text-gray-600">{day.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max(5, (day.revenue / Math.max(...analytics.dailyRevenue.map((d: any) => d.revenue))) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{day.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{day.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.ordersByStatus || {}).map(([status, count]: [string, any]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-gray-600 capitalize">
                      {status.replace('_', ' ')}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max(5, (count / analytics.totalOrders) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{count}</p>
                    <p className="text-xs text-gray-500">
                      {((count / analytics.totalOrders) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-sm font-medium">
                  {analytics.totalOrders > 0 
                    ? ((analytics.ordersByStatus?.delivered || 0) / analytics.totalOrders * 100).toFixed(1)
                    : 0
                  }%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Order Value</span>
                <span className="text-sm font-medium">₹{Math.round(analytics.averageOrderValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orders per Day</span>
                <span className="text-sm font-medium">
                  {Math.round((analytics.totalOrders || 0) / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Customers</span>
                <span className="text-sm font-medium text-green-600">+{analytics.newCustomers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue Growth</span>
                <span className="text-sm font-medium text-green-600">
                  ₹{analytics.totalRevenue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Products</span>
                <span className="text-sm font-medium">{analytics.activeProducts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Trends
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Customer Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}