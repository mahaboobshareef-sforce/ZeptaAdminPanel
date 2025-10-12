import React, { useEffect, useState } from 'react';
import { RefreshCw, Package, AlertTriangle, Calculator, TrendingUp, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import {
  fetchProductVariants,
  fetchStores,
  fetchBulkInventory,
  calculateVariantAvailability,
  getAllVariantAvailability
} from '../lib/supabase';
import { supabase } from '../lib/supabase';

export default function Inventory() {
  const [variants, setVariants] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [bulkInventory, setBulkInventory] = useState<any[]>([]);
  const [variantAvailability, setVariantAvailability] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [storeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stores first for filter
      const storesResult = await fetchStores();
      setStores(storesResult.data || []);

      // Then load variants and bulk inventory in parallel
      let bulkQuery = supabase
        .from('bulk_inventory')
        .select(`
          *,
          product:products(
            id,
            name,
            category:categories(id, name)
          )
        `);

      // Filter bulk inventory by store if needed
      if (storeFilter !== 'all') {
        bulkQuery = bulkQuery.eq('store_id', storeFilter);
      }

      const [variantsResult, bulkResult] = await Promise.all([
        fetchProductVariants(),
        bulkQuery
      ]);

      if (variantsResult.error) {
        throw new Error(variantsResult.error.message || 'Failed to fetch variants');
      }

      // Sort variants by created_at (latest first)
      const sortedVariants = (variantsResult.data || []).sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setVariants(sortedVariants);
      setBulkInventory(bulkResult.data || []);

      // Calculate availability for specific store (already filtered by query)
      if (storeFilter !== 'all') {
        const availability: Record<string, number> = {};
        sortedVariants.forEach(variant => {
          const calculated = calculateAvailabilityFromBulk(variant, storeFilter);
          availability[variant.id] = calculated;
        });
        setVariantAvailability(availability);
      }

    } catch (err) {
      console.error('❌ Inventory loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailabilityFromBulk = (variant: any, storeId: string) => {
    const bulkStock = bulkInventory.find(b => 
      b.product_id === variant.product_id && b.store_id === storeId
    );
    
    if (!bulkStock || !bulkStock.available_quantity) return 0;
    
    const baseUnitQuantity = variant.base_unit_quantity || 1.0;
    return Math.floor(bulkStock.available_quantity / baseUnitQuantity);
  };

  const getFilteredVariants = () => {
    let filteredData;
    
    if (storeFilter === 'all') {
      // Group variants by product and show summary
      const productGroups: Record<string, any[]> = {};
      variants.forEach(variant => {
        const productId = variant.product_id;
        if (!productGroups[productId]) {
          productGroups[productId] = [];
        }
        productGroups[productId].push(variant);
      });
      
      filteredData = Object.values(productGroups).map(group => ({
        ...group[0],
        variants: group,
        isGroup: true
      }));
    } else {
      // Show individual variants for selected store
      filteredData = variants.filter(variant => 
        bulkInventory.some(bulk => 
          bulk.product_id === variant.product_id && bulk.store_id === storeFilter
        )
      );
    }
    
    // Apply search filter
    if (!searchQuery.trim()) return filteredData;
    
    return filteredData.filter(item => 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit_label?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getTotalStats = () => {
    const filteredVariants = getFilteredVariants();
    const totalVariants = filteredVariants.length;
    const availableVariants = storeFilter === 'all' 
      ? filteredVariants.filter(v => 
          bulkInventory.some(b => b.product_id === v.product_id && (b.available_quantity || 0) > 0)
        ).length
      : Object.values(variantAvailability).filter(qty => qty > 0).length;
    
    const lowStockVariants = storeFilter === 'all'
      ? 0 // Can't calculate for all stores
      : Object.values(variantAvailability).filter(qty => qty > 0 && qty <= 5).length;
    
    const outOfStockVariants = storeFilter === 'all'
      ? 0 // Can't calculate for all stores  
      : Object.values(variantAvailability).filter(qty => qty === 0).length;

    return {
      totalVariants,
      availableVariants,
      lowStockVariants,
      outOfStockVariants
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Inventory Loading Error</CardTitle>
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
          <p className="text-gray-600">Real-time variant availability calculated from bulk inventory</p>
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
            <option value="all">All Stores (Summary)</option>
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
            placeholder="Search products, variants, or categories..."
            className="pl-10"
          />
        </div>
      </div>
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Dynamic Inventory System</p>
            <p className="text-sm text-blue-700">
              Variant availability is calculated automatically from bulk inventory. 
              To add stock, use <strong>Purchase Management</strong>. 
              Orders deduct directly from bulk inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Variants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVariants}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Variants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableVariants}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockVariants}</p>
                <p className="text-xs text-gray-500">≤5 units available</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockVariants}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      {getFilteredVariants().length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">
              {searchQuery ? 'No Matching Results' : 'No Inventory Data'}
            </CardTitle>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No inventory items match "${searchQuery}". Try a different search term.`
                : storeFilter === 'all' 
                  ? 'No products with bulk inventory found.' 
                  : 'No bulk inventory found for this store.'
              }
            </p>
            <p className="text-sm text-gray-500">
              Add inventory through <strong>Purchase Management</strong> to see variant availability here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {storeFilter === 'all' ? 'Product Variant Summary' : 'Store Variant Availability'}
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({getFilteredVariants().length} of {storeFilter === 'all' ? variants.length : variants.filter(v => bulkInventory.some(b => b.product_id === v.product_id && b.store_id === storeFilter)).length} items)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                {storeFilter === 'all' ? (
                  <>
                    <TableHead>Total Variants</TableHead>
                    <TableHead>Stores with Stock</TableHead>
                    <TableHead>Total Bulk Stock</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Variant</TableHead>
                    <TableHead>Bulk Stock</TableHead>
                    <TableHead>Available Units</TableHead>
                    <TableHead>Unit Conversion</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredVariants().map((item) => {
                if (storeFilter === 'all' && item.isGroup) {
                  // Summary view for all stores
                  const productBulkStock = bulkInventory
                    .filter(b => b.product_id === item.product_id)
                    .reduce((sum, b) => sum + (b.available_quantity || 0), 0);
                  
                  const storesWithStock = bulkInventory
                    .filter(b => b.product_id === item.product_id && (b.available_quantity || 0) > 0)
                    .length;
                  
                  return (
                    <TableRow key={item.product_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name}</p>
                            <p className="text-sm text-gray-500">{item.product?.category?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.variants?.length || 0} variants</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{storesWithStock} stores</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{productBulkStock.toFixed(2)} kg</p>
                          <p className="text-sm text-gray-500">Total across stores</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={productBulkStock > 0 ? 'success' : 'error'}>
                          {productBulkStock > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  // Detailed view for specific store
                  const availability = calculateAvailabilityFromBulk(item, storeFilter);
                  const bulkStock = bulkInventory.find(b => 
                    b.product_id === item.product_id && b.store_id === storeFilter
                  );
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product?.name}</p>
                            <p className="text-sm text-gray-500">{item.product?.category?.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.unit_label}</p>
                          <p className="text-sm text-gray-500">₹{Number(item.price).toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-blue-600">
                            {Number(bulkStock?.available_quantity || 0).toFixed(2)} {bulkStock?.unit_label || 'kg'}
                          </p>
                          <p className="text-sm text-gray-500">Bulk available</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-green-600 text-lg">{availability}</p>
                          <p className="text-sm text-gray-500">units available</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          <p>1 unit = {item.base_unit_quantity || 1} {item.base_unit_label || 'kg'}</p>
                          <p className="text-xs text-gray-500">
                            {bulkStock?.available_quantity || 0} ÷ {item.base_unit_quantity || 1} = {availability}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {availability === 0 ? (
                          <Badge variant="error">Out of Stock</Badge>
                        ) : availability <= 5 ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>How This Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📦 Adding Stock</h4>
              <p className="text-sm text-gray-600 mb-3">
                Use <strong>Purchase Management</strong> to record bulk purchases. 
                Stock automatically appears in <strong>Bulk Inventory</strong> and 
                variant availability is calculated here.
              </p>
              
              <h4 className="font-medium text-gray-900 mb-2">🔄 How Orders Work</h4>
              <p className="text-sm text-gray-600">
                When customers order variants (500g, 1kg), the system automatically 
                deducts the equivalent amount from bulk inventory using FIFO costing.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Availability Calculation</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>250g packets</strong> = Bulk Stock ÷ 0.25kg</p>
                <p>• <strong>500g packets</strong> = Bulk Stock ÷ 0.5kg</p>
                <p>• <strong>1kg packets</strong> = Bulk Stock ÷ 1kg</p>
                <p>• <strong>Fixed packages</strong> = Direct count from bulk</p>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 mt-4">💡 Example</h4>
              <p className="text-sm text-gray-600">
                20kg bulk potatoes can be sold as 80×250g OR 40×500g OR 20×1kg 
                OR any combination that totals ≤20kg.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}