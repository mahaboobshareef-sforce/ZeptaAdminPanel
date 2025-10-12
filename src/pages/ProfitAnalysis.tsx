import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Modal, { ModalBody } from '../components/UI/Modal';
import {
  getProfitAnalysis,
  getProductProfitDetails,
  fetchStores
} from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';

export default function ProfitAnalysis() {
  const { can } = usePermissions();

  if (!can('view_profit_analysis')) {
    return null;
  }
  const [profitData, setProfitData] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productDetails, setProductDetails] = useState<any[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue'>('profit');

  useEffect(() => {
    loadData();
  }, [storeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profitResult, storesResult] = await Promise.all([
        getProfitAnalysis(storeFilter === 'all' ? undefined : storeFilter),
        fetchStores()
      ]);
      
      if (profitResult.error) {
        throw new Error(profitResult.error.message || 'Failed to fetch profit analysis');
      }
      
      // Filter out products with no activity
      const activeData = (profitResult.data || []).filter(item => 
        item.total_purchased > 0 || item.total_sold > 0 || item.current_stock > 0
      );
      
      setProfitData(activeData);
      setStores(storesResult.data || []);
      
    } catch (err) {
      console.error('❌ Profit analysis loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profit analysis');
    } finally {
      setLoading(false);
    }
  };

  const openProductDetails = async (product: any) => {
    try {
      setSelectedProduct(product);
      
      const result = await getProductProfitDetails(product.product_id, product.store_id);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch product details');
      }
      
      setProductDetails(result.data || []);
      setShowDetailsModal(true);
      
    } catch (err) {
      alert(`Failed to load product details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getSortedData = () => {
    const sorted = [...profitData];
    
    switch (sortBy) {
      case 'profit':
        return sorted.sort((a, b) => (b.net_profit || 0) - (a.net_profit || 0));
      case 'margin':
        return sorted.sort((a, b) => (b.net_profit_margin_percent || 0) - (a.net_profit_margin_percent || 0));
      case 'revenue':
        return sorted.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
      default:
        return sorted;
    }
  };

  const getTotalStats = () => {
    return profitData.reduce((acc, item) => ({
      totalInvestment: acc.totalInvestment + (item.total_purchase_cost || 0),
      totalRevenue: acc.totalRevenue + (item.total_revenue || 0),
      totalProfit: acc.totalProfit + (item.net_profit || 0),
      totalLosses: acc.totalLosses + (item.total_loss_value || 0),
      currentStockValue: acc.currentStockValue + (item.current_stock_value || 0)
    }), {
      totalInvestment: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalLosses: 0,
      currentStockValue: 0
    });
  };

  const stats = getTotalStats();
  const overallMargin = stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100) : 0;

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading profit analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Profit Analysis Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>
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
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Analysis</h1>
          <p className="text-gray-600">Comprehensive profit analysis with FIFO costing</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'profit' | 'margin' | 'revenue')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="profit">Sort by Profit</option>
            <option value="margin">Sort by Margin %</option>
            <option value="revenue">Sort by Revenue</option>
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalInvestment.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}₹{stats.totalProfit.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {overallMargin.toFixed(1)}% margin
                </p>
              </div>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Losses</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{stats.totalLosses.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.currentStockValue.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis Table */}
      {profitData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Profit Data Available</CardTitle>
            <p className="text-gray-600">Start recording purchases and sales to see profit analysis.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Product-wise Profit Analysis</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Losses</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Margin %</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedData().map((item) => (
                <TableRow key={`${item.product_id}-${item.store_id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-500">{item.category_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{item.store_name}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">₹{Number(item.total_purchase_cost || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {Number(item.total_purchased || 0).toFixed(2)} units
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">₹{Number(item.total_revenue || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {Number(item.total_sold || 0).toFixed(2)} units sold
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{Number(item.current_stock || 0).toFixed(2)} units</p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(item.current_stock_value || 0).toLocaleString()} value
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-red-600">
                        ₹{Number(item.total_loss_value || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {Number(item.total_losses || 0).toFixed(2)} units lost
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(item.net_profit || 0) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className={`font-bold ${(item.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(item.net_profit || 0) >= 0 ? '+' : ''}₹{Number(item.net_profit || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        (item.net_profit_margin_percent || 0) >= 20 ? 'success' :
                        (item.net_profit_margin_percent || 0) >= 10 ? 'warning' :
                        (item.net_profit_margin_percent || 0) >= 0 ? 'info' : 'error'
                      }
                    >
                      {Number(item.net_profit_margin_percent || 0).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openProductDetails(item)}
                      icon={Eye}
                    >
                      <span className="sr-only">View Details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Product Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProduct(null);
          setProductDetails([]);
        }}
        title={`Profit Details - ${selectedProduct?.product_name || ''}`}
        size="xl"
      >
        {selectedProduct && (
          <ModalBody>
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Purchased</p>
                      <p className="text-xl font-bold">
                        {Number(selectedProduct.total_purchased || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(selectedProduct.total_purchase_cost || 0).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Sold</p>
                      <p className="text-xl font-bold">
                        {Number(selectedProduct.total_sold || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(selectedProduct.total_revenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-xl font-bold">
                        {Number(selectedProduct.current_stock || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(selectedProduct.current_stock_value || 0).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className={`text-xl font-bold ${(selectedProduct.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(selectedProduct.net_profit || 0) >= 0 ? '+' : ''}₹{Number(selectedProduct.net_profit || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {Number(selectedProduct.net_profit_margin_percent || 0).toFixed(1)}% margin
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase Batches */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Batches</h3>
                <div className="space-y-3">
                  {productDetails.map((batch) => (
                    <div key={batch.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="info">{batch.batch_number}</Badge>
                            <span className="text-sm text-gray-600">
                              {format(new Date(batch.purchase_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Purchased</p>
                              <p className="font-medium">
                                {Number(batch.quantity).toFixed(2)} {batch.unit_label}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Remaining</p>
                              <p className="font-medium">
                                {Number(batch.remaining_quantity || 0).toFixed(2)} {batch.unit_label}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Cost/Unit</p>
                              <p className="font-medium">
                                ₹{Number(batch.cost_per_unit).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total Cost</p>
                              <p className="font-medium">
                                ₹{Number(batch.total_cost).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {batch.supplier_name && (
                            <p className="text-sm text-gray-600 mt-2">
                              Supplier: {batch.supplier_name}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.max(5, ((batch.remaining_quantity || 0) / batch.quantity) * 100)}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {(((batch.remaining_quantity || 0) / batch.quantity) * 100).toFixed(1)}% remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>
    </div>
  );
}