import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, Store, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { supabase } from '../lib/supabase';
import {
  fetchBulkInventory,
  getBulkInventoryByStore,
  fetchStores
} from '../lib/supabase';

export default function BulkInventory() {
  const [bulkInventory, setBulkInventory] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [storeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bulk_inventory')
        .select(`
          *,
          product:products(
            id,
            name,
            description,
            category:categories(
              id,
              name
            ),
            variants:product_variants(
              id,
              unit_label,
              base_unit_quantity,
              base_unit_label
            )
          ),
          store:stores(
            id,
            name
          )
        `);

      if (storeFilter !== 'all') {
        query = query.eq('store_id', storeFilter);
      }

      const [inventoryResult, storesResult] = await Promise.all([
        query.order('created_at', { ascending: false }),
        fetchStores()
      ]);

      if (inventoryResult.error) {
        throw new Error(inventoryResult.error.message || 'Failed to fetch bulk inventory');
      }

      setBulkInventory(inventoryResult.data || []);
      setStores(storesResult.data || []);

    } catch (err) {
      console.error('❌ Bulk inventory loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bulk inventory');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInventory = () => {
    if (!searchQuery.trim()) return bulkInventory;
    
    return bulkInventory.filter(item => 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredInventoryOld = () => {
    if (!searchQuery.trim()) return bulkInventory;
    
    return bulkInventory.filter(item => 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  const calculateVariantStock = (bulkItem: any, variant: any) => {
    if (!bulkItem.available_quantity || !variant.base_unit_quantity) return 0;
    return Math.floor(bulkItem.available_quantity / variant.base_unit_quantity);
  };

  const getTotalStockValue = () => {
    return getFilteredInventory().reduce((sum, item) => 
      sum + ((item.available_quantity || 0) * (item.weighted_avg_cost || 0)), 0
    );
  };

  const getLowStockItems = () => {
    return getFilteredInventory().filter(item => (item.available_quantity || 0) < 5);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading bulk inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Bulk Inventory Loading Error</CardTitle>
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
          <h1 className="text-3xl font-bold text-gray-900">Bulk Inventory</h1>
          <p className="text-gray-600">Monitor bulk stock levels and variant availability</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <select
            value={storeFilter}
            onChange={(e) => {
              setFiltering(true);
              setStoreFilter(e.target.value);
              setTimeout(() => setFiltering(false), 100);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products, stores, or categories..."
            className="pl-10"
          />
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{bulkInventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{getTotalStockValue().toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{getLowStockItems().length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost/Unit</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{bulkInventory.length > 0 
                    ? (bulkInventory.reduce((sum, item) => sum + (item.weighted_avg_cost || 0), 0) / bulkInventory.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
              <Store className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Inventory Table */}
      {getFilteredInventory().length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">
              {searchQuery ? 'No Matching Results' : 'No Bulk Inventory Found'}
            </CardTitle>
            <p className="text-gray-600">
              {searchQuery 
                ? `No inventory items match "${searchQuery}". Try a different search term.`
                : 'Start by recording purchases to build your bulk inventory.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Bulk Stock Overview 
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({getFilteredInventory().length} of {bulkInventory.length} items)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Bulk Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Avg Cost</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Variant Availability</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredInventory().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.product?.category?.name || 'No category'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {item.store?.name || 'Unknown Store'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {Number(item.total_quantity || 0).toFixed(2)} {item.unit_label}
                      </p>
                      <Badge variant="info" size="sm">
                        {item.unit_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-yellow-600">
                      {Number(item.reserved_quantity || 0).toFixed(2)} {item.unit_label}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-green-600">
                      {Number(item.available_quantity || 0).toFixed(2)} {item.unit_label}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      ₹{Number(item.weighted_avg_cost || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">per {item.unit_label}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">
                      ₹{((item.available_quantity || 0) * (item.weighted_avg_cost || 0)).toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.product?.variants?.slice(0, 3).map((variant: any) => (
                        <div key={variant.id} className="flex justify-between text-xs">
                          <span className="text-gray-600">{variant.unit_label}:</span>
                          <span className="font-medium">
                            {calculateVariantStock(item, variant)} units
                          </span>
                        </div>
                      ))}
                      {item.product?.variants?.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{item.product.variants.length - 3} more variants
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(item.available_quantity || 0) === 0 ? (
                      <Badge variant="error">Out of Stock</Badge>
                    ) : (item.available_quantity || 0) < 5 ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}