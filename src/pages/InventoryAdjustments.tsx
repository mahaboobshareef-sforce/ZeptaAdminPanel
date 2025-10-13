import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, AlertTriangle, Trash2, Package, DollarSign, Calendar, Edit } from 'lucide-react';
import { supabase, fetchInventoryAdjustments, updateInventoryAdjustment, deleteInventoryAdjustment, fetchStores, fetchProducts } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { format } from 'date-fns';

export default function InventoryAdjustments() {
  const { profile } = useAuth();
  const { can } = usePermissions();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<{ available: number; avgCost: number; unitLabel: string } | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    product_id: '',
    adjustment_type: '',
    quantity_adjusted: '',
    unit_type: 'weight',
    unit_label: 'kg',
    cost_impact: '',
    reason: '',
    reference_batch_id: '',
    adjustment_date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  // Load available products when store changes
  useEffect(() => {
    if (formData.store_id) {
      loadAvailableProducts();
    } else {
      setAvailableProducts([]);
    }
  }, [formData.store_id]);

  // Load stock info when both store and product are selected
  useEffect(() => {
    if (formData.store_id && formData.product_id) {
      loadStockInfo();
    } else {
      setStockInfo(null);
      setStockError(null);
    }
  }, [formData.store_id, formData.product_id]);

  const loadAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_inventory')
        .select(`
          product_id,
          available_quantity,
          product:products(id, name)
        `)
        .eq('store_id', formData.store_id);

      if (error) throw error;

      // Get unique products that have any stock
      const uniqueProducts = (data || []).reduce((acc: any[], item) => {
        if (!acc.find(p => p.product_id === item.product_id)) {
          acc.push({
            product_id: item.product_id,
            product_name: item.product?.name || 'Unknown Product',
            total_available: (data || [])
              .filter(d => d.product_id === item.product_id)
              .reduce((sum, d) => sum + (d.available_quantity || 0), 0)
          });
        }
        return acc;
      }, []);

      setAvailableProducts(uniqueProducts);

    } catch (error) {
      console.error('Error loading available products:', error);
      setAvailableProducts([]);
    }
  };

  const loadStockInfo = async () => {
    try {
      setLoadingStock(true);
      setStockError(null);

      const { data, error } = await supabase
        .from('bulk_inventory')
        .select('available_quantity, weighted_avg_cost, unit_label')
        .eq('store_id', formData.store_id)
        .eq('product_id', formData.product_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStockInfo({
          available: Number(data.available_quantity || 0),
          avgCost: Number(data.weighted_avg_cost || 0),
          unitLabel: data.unit_label || 'kg'
        });
      } else {
        setStockInfo({ available: 0, avgCost: 0, unitLabel: 'kg' });
      }

    } catch (error) {
      setStockError(error instanceof Error ? error.message : 'Error loading stock information');
    } finally {
      setLoadingStock(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [adjustmentsResult, storesResult, productsResult] = await Promise.all([
        fetchInventoryAdjustments(),
        fetchStores(),
        fetchProducts()
      ]);
      
      if (adjustmentsResult.error) {
        throw new Error(adjustmentsResult.error.message || 'Failed to fetch adjustments');
      }
      
      setAdjustments(adjustmentsResult.data || []);
      setStores(storesResult.data || []);
      setProducts(productsResult.data || []);
      
    } catch (err) {
      console.error('❌ Adjustments loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.store_id) errors.store_id = 'Store is required';
    if (!formData.product_id) errors.product_id = 'Product is required';
    if (!formData.adjustment_type) errors.adjustment_type = 'Adjustment type is required';
    
    const adjustmentQty = Number(formData.quantity_adjusted) || 0;
    if (adjustmentQty <= 0) {
      errors.quantity_adjusted = 'Adjustment quantity must be greater than 0';
    }
    
    // Check if enough stock is available
    if (stockInfo && adjustmentQty > stockInfo.available) {
      errors.quantity_adjusted = `Insufficient stock. Available: ${stockInfo.available.toFixed(2)} ${stockInfo.unitLabel || 'kg'}`;
    }
    
    // Prevent adjustment if no stock exists
    if (stockInfo && stockInfo.available === 0) {
      errors.product_id = 'No stock available for this product at selected store';
    }
    
    if (!formData.cost_impact || Number(formData.cost_impact) < 0) {
      errors.cost_impact = 'Valid cost impact is required';
    }
    if (!formData.reason) errors.reason = 'Reason is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.store_id) {
      alert('Please select a store');
      return;
    }
    
    if (!formData.product_id) {
      alert('Please select a product');
      return;
    }
    
    if (!formData.adjustment_type) {
      alert('Please select adjustment type');
      return;
    }
    
    const quantity = Number(formData.quantity_adjusted);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    // Check stock availability
    if (stockInfo && quantity > stockInfo.available) {
      alert(`Insufficient stock. Available: ${stockInfo.available.toFixed(2)} ${stockInfo.unitLabel}`);
      return;
    }
    
    const costImpact = Number(formData.cost_impact);
    if (!costImpact || costImpact < 0) {
      alert('Please enter a valid cost impact');
      return;
    }
    
    if (!formData.reason.trim()) {
      alert('Please provide a reason');
      return;
    }
    
    try {
      // Call RPC function to apply adjustment
      const { error } = await supabase.rpc('apply_inventory_adjustment', {
        p_store_id: formData.store_id,
        p_product_id: formData.product_id,
        p_variant_id: null, // Always null for bulk adjustments
        p_adjustment_type: formData.adjustment_type,
        p_quantity: quantity,
        p_unit_type: formData.unit_type,
        p_cost_impact: costImpact,
        p_reason: formData.reason
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create adjustment');
      }
      
      alert('✅ Adjustment recorded successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadData();
      
    } catch (err) {
      console.error('Adjustment creation failed:', err);
      alert(`Failed to create adjustment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustment || !validateForm()) return;
    
    try {
      setUpdating(selectedAdjustment.id);
      
      const adjustmentData = {
        store_id: formData.store_id,
        product_id: formData.product_id,
        adjustment_type: formData.adjustment_type,
        quantity_adjusted: Number(formData.quantity_adjusted),
        unit_type: formData.unit_type,
        unit_label: formData.unit_label,
        cost_impact: Number(formData.cost_impact),
        reason: formData.reason,
        reference_batch_id: formData.reference_batch_id || null,
        adjustment_date: formData.adjustment_date
      };
      
      const result = await updateInventoryAdjustment(selectedAdjustment.id, adjustmentData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update adjustment');
      }
      
      setShowEditModal(false);
      setSelectedAdjustment(null);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to update adjustment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // Function to update bulk inventory after adjustment
  const handleDeleteAdjustment = async (adjustmentId: string) => {
    if (!confirm('Are you sure you want to delete this inventory adjustment? This action cannot be undone.')) return;
    
    try {
      setUpdating(adjustmentId);
      
      // Get adjustment details before deletion to reverse the inventory impact
      const adjustmentToDelete = adjustments.find(a => a.id === adjustmentId);
      
      const result = await deleteInventoryAdjustment(adjustmentId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete adjustment');
      }
      
      // Reverse the inventory adjustment
      // The database trigger will handle bulk inventory updates automatically
      
      await loadData();
      
    } catch (err) {
      alert(`Failed to delete adjustment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: '',
      product_id: '',
      adjustment_type: '',
      quantity_adjusted: '',
      unit_type: 'weight',
      unit_label: 'kg',
      cost_impact: '',
      reason: '',
      reference_batch_id: '',
      adjustment_date: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
  };

  const openEditModal = (adjustment: any) => {
    setSelectedAdjustment(adjustment);
    setFormData({
      store_id: adjustment.store_id || '',
      product_id: adjustment.product_id || '',
      adjustment_type: adjustment.adjustment_type || '',
      quantity_adjusted: adjustment.quantity_adjusted?.toString() || '',
      unit_type: adjustment.unit_type || 'weight',
      unit_label: adjustment.unit_label || 'kg',
      cost_impact: adjustment.cost_impact?.toString() || '',
      reason: adjustment.reason || '',
      reference_batch_id: adjustment.reference_batch_id || '',
      adjustment_date: adjustment.adjustment_date ? adjustment.adjustment_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const filteredAdjustments = typeFilter === 'all' 
    ? adjustments 
    : adjustments.filter(adj => adj.adjustment_type === typeFilter);

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  const adjustmentTypeOptions = [
    { value: 'damage', label: 'Damage/Spoilage' },
    { value: 'expiry', label: 'Expired Items' },
    { value: 'theft', label: 'Theft/Missing' },
    { value: 'correction', label: 'Stock Correction' },
    { value: 'return', label: 'Return to Supplier' }
  ];

  const unitTypeOptions = [
    { value: 'weight', label: 'Weight (kg, g)' },
    { value: 'count', label: 'Count (pieces, bundles)' },
    { value: 'volume', label: 'Volume (liters, ml)' }
  ];

  const getAvailableProductOptions = () => {
    if (!formData.store_id) {
      return [];
    }
    
    // Show products that have bulk inventory at this store
    return availableProducts.map(product => ({
      value: product.product_id,
      label: `${product.product_name} (${product.total_available.toFixed(2)} available)`
    }));
  };
  
  // Auto-suggest cost impact based on average cost

  const getUnitLabelOptions = (unitType: string) => {
    switch (unitType) {
      case 'weight':
        return [
          { value: 'kg', label: 'Kilograms (kg)' },
          { value: 'g', label: 'Grams (g)' }
        ];
      case 'count':
        return [
          { value: 'pieces', label: 'Pieces' },
          { value: 'bundles', label: 'Bundles' },
          { value: 'packets', label: 'Packets' }
        ];
      case 'volume':
        return [
          { value: 'liters', label: 'Liters' },
          { value: 'ml', label: 'Milliliters' }
        ];
      default:
        return [{ value: 'kg', label: 'Kilograms (kg)' }];
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'damage': return 'error';
      case 'expiry': return 'warning';
      case 'theft': return 'error';
      case 'correction': return 'info';
      case 'return': return 'success';
      default: return 'default';
    }
  };

  const getAdjustmentTypeIcon = (type: string) => {
    switch (type) {
      case 'damage': return AlertTriangle;
      case 'expiry': return Calendar;
      case 'theft': return AlertTriangle;
      case 'correction': return Package;
      case 'return': return RefreshCw;
      default: return Package;
    }
  };

  // Auto-suggest cost impact based on average cost
  const suggestCostImpact = () => {
    if (stockInfo && stockInfo.avgCost && formData.quantity_adjusted) {
      const suggestedCost = (Number(formData.quantity_adjusted) * stockInfo.avgCost).toFixed(2);
      setFormData({...formData, cost_impact: suggestedCost});
    }
  };

  if (!can('inventory_adjustments')) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading inventory adjustments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Adjustments Loading Error</CardTitle>
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Adjustments</h1>
          <p className="text-gray-600">Track inventory losses, damages, and corrections ({adjustments.length} records)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="damage">Damage/Spoilage</option>
            <option value="expiry">Expired Items</option>
            <option value="theft">Theft/Missing</option>
            <option value="correction">Stock Correction</option>
            <option value="return">Return to Supplier</option>
          </select>
          
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Record Adjustment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                <p className="text-2xl font-bold text-gray-900">{adjustments.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Loss Value</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{adjustments
                    .filter(a => ['damage', 'expiry', 'theft'].includes(a.adjustment_type))
                    .reduce((sum, a) => sum + (parseFloat(a.cost_impact) || 0), 0)
                    .toLocaleString()
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adjustments.filter(a => {
                    const adjDate = new Date(a.adjustment_date);
                    const now = new Date();
                    return adjDate.getMonth() === now.getMonth() && 
                           adjDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Damage/Expiry</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adjustments.filter(a => ['damage', 'expiry'].includes(a.adjustment_type)).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments Table */}
      {filteredAdjustments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Adjustments Found</CardTitle>
            <p className="text-gray-600 mb-4">
              {adjustments.length === 0 
                ? 'No inventory adjustments recorded yet.' 
                : `No adjustments of type "${typeFilter}" found.`
              }
            </p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Record First Adjustment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost Impact</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Adjusted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.map((adjustment) => {
                const TypeIcon = getAdjustmentTypeIcon(adjustment.adjustment_type);
                
                return (
                  <TableRow key={adjustment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="h-4 w-4" />
                        <Badge variant={getAdjustmentTypeColor(adjustment.adjustment_type)}>
                          {adjustment.adjustment_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium">
                          {adjustment.product?.name || 'Unknown Product'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {adjustment.store?.name || 'Unknown Store'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-red-600">
                          -{Number(adjustment.quantity_adjusted).toFixed(2)} {adjustment.unit_label}
                        </p>
                        <Badge variant="info" size="sm">
                          {adjustment.unit_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-red-600">
                        -₹{Number(adjustment.cost_impact).toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {adjustment.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {adjustment.adjusted_by_user?.full_name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(adjustment.adjustment_date), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditModal(adjustment)} 
                          icon={Edit}
                          disabled={updating === adjustment.id}
                        >
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAdjustment(adjustment.id)} 
                          icon={Trash2}
                          disabled={updating === adjustment.id}
                          className="text-red-600 hover:text-red-800"
                        >
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Record Inventory Adjustment"
        size="lg"
      >
        <form onSubmit={handleCreateAdjustment}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Store"
                  value={formData.store_id}
                  onChange={(value) => {
                    setFormData({...formData, store_id: value, product_id: ''});
                    setFormErrors({...formErrors, store_id: '', product_id: ''});
                  }}
                  options={storeOptions}
                  required
                  error={formErrors.store_id}
                />
                
                <Select
                  label="Product"
                  value={formData.product_id}
                  onChange={(value) => {
                    setFormData({...formData, product_id: value});
                    setFormErrors({...formErrors, product_id: ''});
                  }}
                  options={formData.store_id ? getAvailableProductOptions() : []}
                  required
                  error={formErrors.product_id}
                  placeholder="Select product"
                  disabled={!formData.store_id}
                />
              </div>
              
              {formData.store_id && products.length > 0 && getAvailableProductOptions().length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">No Products Available</p>
                      <p className="text-sm text-yellow-700">
                        No products with bulk inventory found at this store. Add inventory through Purchase Management first.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Select
                label="Adjustment Type"
                value={formData.adjustment_type}
                onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                options={adjustmentTypeOptions}
                required
                error={formErrors.adjustment_type}
                placeholder="Select adjustment type"
              />
              
              {stockInfo && formData.product_id && formData.store_id && (
                <div className={`border rounded-lg p-4 ${
                  stockError ? 'bg-red-50 border-red-200' :
                  !stockInfo.available ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Package className={`h-5 w-5 ${
                      stockError ? 'text-red-600' :
                      !stockInfo.available ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        stockError ? 'text-red-800' :
                        !stockInfo.available ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {stockError ? 'Stock Information Error' : 'Current Stock Level'}
                      </p>
                      <p className={`text-sm ${
                        stockError ? 'text-red-700' :
                        !stockInfo.available ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {stockError ? stockError : `Available: ${stockInfo.available.toFixed(2)} ${stockInfo.unitLabel}`}
                      </p>
                      {stockInfo.available && stockInfo.avgCost > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Avg Cost: ₹{stockInfo.avgCost.toFixed(2)} per {stockInfo.unitLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {stockInfo.available && stockInfo.avgCost > 0 && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={suggestCostImpact}
                        disabled={!formData.quantity_adjusted}
                        className="text-xs"
                      >
                        Auto-calculate cost impact
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {loadingStock && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <div>
                      <p className="font-medium text-gray-800">Loading Stock Information</p>
                      <p className="text-sm text-gray-700">
                        Checking availability...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantity Lost/Adjusted"
                  type="number"
                  value={formData.quantity_adjusted}
                  onChange={(value) => setFormData({...formData, quantity_adjusted: value})}
                  required
                  error={formErrors.quantity_adjusted}
                  placeholder="3.5"
                  min="0"
                  step="0.01"
                />
                
                <Select
                  label="Unit Type"
                  value={formData.unit_type}
                  onChange={(e) => setFormData({...formData, unit_type: e.target.value, unit_label: getUnitLabelOptions(e.target.value)[0]?.value || 'kg'})}
                  options={unitTypeOptions}
                  required
                />
                
                <Select
                  label="Unit"
                  value={formData.unit_label}
                  onChange={(e) => setFormData({...formData, unit_label: e.target.value})}
                  options={getUnitLabelOptions(formData.unit_type)}
                  required
                />
              </div>
              
              <Input
                label="Cost Impact (₹)"
                type="number"
                value={formData.cost_impact}
                onChange={(value) => setFormData({...formData, cost_impact: value})}
                required
                error={formErrors.cost_impact}
                placeholder={stockInfo?.avgCost && formData.quantity_adjusted 
                  ? `Suggested: ${(Number(formData.quantity_adjusted) * stockInfo.avgCost).toFixed(2)}`
                  : "Enter cost impact"
                }
                min="0"
                step="0.01"
              />
              
              <Input
                label="Reason"
                value={formData.reason}
                onChange={(value) => setFormData({...formData, reason: value})}
                required
                error={formErrors.reason}
                placeholder="Describe the reason for this adjustment"
              />
              
              <Input
                label="Adjustment Date"
                type="date"
                value={formData.adjustment_date}
                onChange={(value) => setFormData({...formData, adjustment_date: value})}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.store_id || !formData.product_id || !formData.adjustment_type || !formData.quantity_adjusted || !formData.cost_impact || !formData.reason}
            >
              Record Adjustment
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Adjustment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAdjustment(null);
          resetForm();
        }}
        title="Edit Inventory Adjustment"
        size="lg"
      >
        <form onSubmit={handleUpdateAdjustment}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Store"
                  value={formData.store_id}
                  onChange={(value) => {
                    setFormData({...formData, store_id: value, product_id: ''});
                    setFormErrors({...formErrors, store_id: '', product_id: ''});
                  }}
                  options={storeOptions}
                  required
                  error={formErrors.store_id}
                />
                
                <Select
                  label="Product"
                  value={formData.product_id}
                  onChange={(value) => {
                    setFormData({...formData, product_id: value});
                    setFormErrors({...formErrors, product_id: ''});
                  }}
                  options={formData.store_id ? getAvailableProductOptions() : []}
                  required
                  error={formErrors.product_id}
                  placeholder="Select product"
                  disabled={!formData.store_id}
                />
              </div>
              
              {formData.store_id && products.length > 0 && getAvailableProductOptions().length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">No Products Available</p>
                      <p className="text-sm text-yellow-700">
                        No products with bulk inventory found at this store. Add inventory through Purchase Management first.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Select
                label="Adjustment Type"
                value={formData.adjustment_type}
                onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                options={adjustmentTypeOptions}
                required
                error={formErrors.adjustment_type}
                placeholder="Select adjustment type"
              />
              
              {stockInfo && formData.product_id && formData.store_id && (
                <div className={`border rounded-lg p-4 ${
                  stockError ? 'bg-red-50 border-red-200' :
                  !stockInfo.available ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Package className={`h-5 w-5 ${
                      stockError ? 'text-red-600' :
                      !stockInfo.available ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        stockError ? 'text-red-800' :
                        !stockInfo.available ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {stockError ? 'Stock Information Error' : 'Current Stock Level'}
                      </p>
                      <p className={`text-sm ${
                        stockError ? 'text-red-700' :
                        !stockInfo.available ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {stockError ? stockError : `Available: ${stockInfo.available.toFixed(2)} ${stockInfo.unitLabel}`}
                      </p>
                      {stockInfo.available && stockInfo.avgCost > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Avg Cost: ₹{stockInfo.avgCost.toFixed(2)} per {stockInfo.unitLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {stockInfo.available && stockInfo.avgCost > 0 && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={suggestCostImpact}
                        disabled={!formData.quantity_adjusted}
                        className="text-xs"
                      >
                        Auto-calculate cost impact
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {loadingStock && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <div>
                      <p className="font-medium text-gray-800">Loading Stock Information</p>
                      <p className="text-sm text-gray-700">
                        Checking availability...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantity Lost/Adjusted"
                  type="number"
                  value={formData.quantity_adjusted}
                  onChange={(value) => setFormData({...formData, quantity_adjusted: value})}
                  required
                  error={formErrors.quantity_adjusted}
                  placeholder="3.5"
                  min="0"
                  step="0.01"
                />
                
                <Select
                  label="Unit Type"
                  value={formData.unit_type}
                  onChange={(e) => setFormData({...formData, unit_type: e.target.value, unit_label: getUnitLabelOptions(e.target.value)[0]?.value || 'kg'})}
                  options={unitTypeOptions}
                  required
                />
                
                <Select
                  label="Unit"
                  value={formData.unit_label}
                  onChange={(e) => setFormData({...formData, unit_label: e.target.value})}
                  options={getUnitLabelOptions(formData.unit_type)}
                  required
                />
              </div>
              
              <Input
                label="Cost Impact (₹)"
                type="number"
                value={formData.cost_impact}
                onChange={(value) => setFormData({...formData, cost_impact: value})}
                required
                error={formErrors.cost_impact}
                placeholder={stockInfo?.avgCost && formData.quantity_adjusted 
                  ? `Suggested: ${(Number(formData.quantity_adjusted) * stockInfo.avgCost).toFixed(2)}`
                  : "Enter cost impact"
                }
                min="0"
                step="0.01"
              />
              
              <Input
                label="Reason"
                value={formData.reason}
                onChange={(value) => setFormData({...formData, reason: value})}
                required
                error={formErrors.reason}
                placeholder="Describe the reason for this adjustment"
              />
              
              <Input
                label="Adjustment Date"
                type="date"
                value={formData.adjustment_date}
                onChange={(value) => setFormData({...formData, adjustment_date: value})}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedAdjustment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating === selectedAdjustment?.id}>
              {updating === selectedAdjustment?.id ? 'Updating...' : 'Update Adjustment'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}