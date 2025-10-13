import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Package, DollarSign, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import {
  fetchPurchaseRecords,
  createPurchaseRecord,
  updatePurchaseRecord,
  deletePurchaseRecord,
  fetchStores,
  fetchProducts
} from '../lib/supabase';
import { format } from 'date-fns';
import { usePermissions } from '../hooks/usePermissions';

export default function PurchaseManagement() {
  const { can } = usePermissions();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    store_id: '',
    product_id: '',
    quantity: '',
    unit_type: 'weight',
    unit_label: 'kg',
    cost_per_unit: '',
    total_cost: '',
    supplier_name: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [purchasesResult, storesResult, productsResult] = await Promise.all([
        fetchPurchaseRecords(),
        fetchStores(),
        fetchProducts()
      ]);
      
      if (purchasesResult.error) {
        throw new Error(purchasesResult.error.message || 'Failed to fetch purchases');
      }
      
      setPurchases(purchasesResult.data || []);
      setStores(storesResult.data || []);
      setProducts(productsResult.data || []);
      
    } catch (err) {
      console.error('❌ Purchase data loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.store_id) errors.store_id = 'Store is required';
    if (!formData.product_id) errors.product_id = 'Product is required';
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = 'Valid quantity is required';
    if (!formData.cost_per_unit || Number(formData.cost_per_unit) <= 0) errors.cost_per_unit = 'Valid cost per unit is required';
    if (!formData.total_cost || Number(formData.total_cost) <= 0) errors.total_cost = 'Valid total cost is required';
    if (!formData.purchase_date) errors.purchase_date = 'Purchase date is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotalCost = () => {
    const quantity = Number(formData.quantity) || 0;
    const costPerUnit = Number(formData.cost_per_unit) || 0;
    return (quantity * costPerUnit).toFixed(2);
  };

  const handleQuantityOrCostChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'quantity' || field === 'cost_per_unit') {
      const quantity = Number(field === 'quantity' ? value : formData.quantity) || 0;
      const costPerUnit = Number(field === 'cost_per_unit' ? value : formData.cost_per_unit) || 0;
      newFormData.total_cost = (quantity * costPerUnit).toFixed(2);
    }
    
    setFormData(newFormData);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const purchaseData = {
        store_id: formData.store_id,
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        unit_type: formData.unit_type,
        unit_label: formData.unit_label,
        cost_per_unit: Number(formData.cost_per_unit),
        total_cost: Number(formData.total_cost),
        supplier_name: formData.supplier_name || null,
        invoice_number: formData.invoice_number || null,
        purchase_date: formData.purchase_date,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes || null
      };
      
      const result = await createPurchaseRecord(purchaseData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create purchase record');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to create purchase record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase || !validateForm()) return;
    
    try {
      const purchaseData = {
        store_id: formData.store_id,
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        unit_type: formData.unit_type,
        unit_label: formData.unit_label,
        cost_per_unit: Number(formData.cost_per_unit),
        total_cost: Number(formData.total_cost),
        supplier_name: formData.supplier_name || null,
        invoice_number: formData.invoice_number || null,
        purchase_date: formData.purchase_date,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes || null
      };
      
      const result = await updatePurchaseRecord(selectedPurchase.id, purchaseData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update purchase record');
      }
      
      setShowEditModal(false);
      setSelectedPurchase(null);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to update purchase record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this purchase record?')) return;
    
    try {
      const result = await deletePurchaseRecord(purchaseId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete purchase record');
      }
      
      await loadData();
      
    } catch (err) {
      alert(`Failed to delete purchase record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: '',
      product_id: '',
      quantity: '',
      unit_type: 'weight',
      unit_label: 'kg',
      cost_per_unit: '',
      total_cost: '',
      supplier_name: '',
      invoice_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: ''
    });
    setFormErrors({});
  };

  const openEditModal = (purchase: any) => {
    setSelectedPurchase(purchase);
    setFormData({
      store_id: purchase.store_id || '',
      product_id: purchase.product_id || '',
      quantity: purchase.quantity?.toString() || '',
      unit_type: purchase.unit_type || 'weight',
      unit_label: purchase.unit_label || 'kg',
      cost_per_unit: purchase.cost_per_unit?.toString() || '',
      total_cost: purchase.total_cost?.toString() || '',
      supplier_name: purchase.supplier_name || '',
      invoice_number: purchase.invoice_number || '',
      purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
      expiry_date: purchase.expiry_date ? purchase.expiry_date.split('T')[0] : '',
      notes: purchase.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const filteredPurchases = storeFilter === 'all' 
    ? purchases 
    : purchases.filter(purchase => purchase.store_id === storeFilter);

  const storeOptions = stores.map(store => ({
    value: store.id,
    label: store.name
  }));

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  const unitTypeOptions = [
    { value: 'weight', label: 'Weight (kg, g)' },
    { value: 'count', label: 'Count (pieces, bundles)' },
    { value: 'volume', label: 'Volume (liters, ml)' }
  ];

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

  if (!can('purchase_management')) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading purchase records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Purchase Records Loading Error</CardTitle>
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
          <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Track all inventory purchases and costs ({purchases.length} records)</p>
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
          
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Record Purchase
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0).toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {purchases.filter(p => {
                    const purchaseDate = new Date(p.purchase_date);
                    const now = new Date();
                    return purchaseDate.getMonth() === now.getMonth() && 
                           purchaseDate.getFullYear() === now.getFullYear();
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
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {purchases.filter(p => (p.remaining_quantity || 0) > 0).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Records Table */}
      {filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Purchase Records Found</CardTitle>
            <p className="text-gray-600 mb-4">Start by recording your first inventory purchase.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Record First Purchase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Details</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm font-medium text-indigo-600">
                        {purchase.batch_number}
                      </p>
                      {purchase.invoice_number && (
                        <p className="text-xs text-gray-500">
                          Invoice: {purchase.invoice_number}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {purchase.product?.name || 'Unknown Product'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {purchase.store?.name || 'Unknown Store'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {Number(purchase.quantity).toLocaleString()} {purchase.unit_label}
                      </p>
                      <Badge variant="info" size="sm">
                        {purchase.unit_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ₹{Number(purchase.total_cost).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(purchase.cost_per_unit).toFixed(2)}/{purchase.unit_label}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {Number(purchase.remaining_quantity || 0).toFixed(2)} {purchase.unit_label}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(5, ((purchase.remaining_quantity || 0) / purchase.quantity) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {purchase.supplier_name || 'Not specified'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                      </p>
                      {purchase.expiry_date && (
                        <p className="text-xs text-red-500">
                          Exp: {format(new Date(purchase.expiry_date), 'MMM dd')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(purchase)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePurchase(purchase.id)} icon={Trash2}>
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Purchase Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Record New Purchase"
        size="lg"
      >
        <form onSubmit={handleCreatePurchase}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Store"
                  value={formData.store_id}
                  onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                  options={storeOptions}
                  required
                  error={formErrors.store_id}
                  placeholder="Select store"
                />
                
                <Select
                  label="Product"
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  options={productOptions}
                  required
                  error={formErrors.product_id}
                  placeholder="Select product"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(value) => handleQuantityOrCostChange('quantity', value)}
                  required
                  error={formErrors.quantity}
                  placeholder="20"
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={`Cost per ${formData.unit_label}`}
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(value) => handleQuantityOrCostChange('cost_per_unit', value)}
                  required
                  error={formErrors.cost_per_unit}
                  placeholder="30.00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  label="Total Cost"
                  type="number"
                  value={formData.total_cost}
                  onChange={(value) => setFormData({...formData, total_cost: value})}
                  required
                  error={formErrors.total_cost}
                  placeholder="600.00"
                  min="0"
                  step="0.01"
                />
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, total_cost: calculateTotalCost()})}
                    className="w-full"
                  >
                    Calculate Total
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Supplier Name"
                  value={formData.supplier_name}
                  onChange={(value) => setFormData({...formData, supplier_name: value})}
                  placeholder="Supplier name"
                />
                
                <Input
                  label="Invoice Number"
                  value={formData.invoice_number}
                  onChange={(value) => setFormData({...formData, invoice_number: value})}
                  placeholder="INV-001"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(value) => setFormData({...formData, purchase_date: value})}
                  required
                  error={formErrors.purchase_date}
                />
                
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(value) => setFormData({...formData, expiry_date: value})}
                  placeholder="Optional for perishables"
                />
              </div>
              
              <Input
                label="Notes"
                value={formData.notes}
                onChange={(value) => setFormData({...formData, notes: value})}
                placeholder="Additional notes about this purchase"
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
            <Button type="submit">
              Record Purchase
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPurchase(null);
          resetForm();
        }}
        title="Edit Purchase Record"
        size="lg"
      >
        <form onSubmit={handleUpdatePurchase}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Store"
                  value={formData.store_id}
                  onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                  options={storeOptions}
                  required
                  error={formErrors.store_id}
                />
                
                <Select
                  label="Product"
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  options={productOptions}
                  required
                  error={formErrors.product_id}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(value) => handleQuantityOrCostChange('quantity', value)}
                  required
                  error={formErrors.quantity}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={`Cost per ${formData.unit_label}`}
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={(value) => handleQuantityOrCostChange('cost_per_unit', value)}
                  required
                  error={formErrors.cost_per_unit}
                  min="0"
                  step="0.01"
                />
                
                <Input
                  label="Total Cost"
                  type="number"
                  value={formData.total_cost}
                  onChange={(value) => setFormData({...formData, total_cost: value})}
                  required
                  error={formErrors.total_cost}
                  min="0"
                  step="0.01"
                />
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, total_cost: calculateTotalCost()})}
                    className="w-full"
                  >
                    Recalculate
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Supplier Name"
                  value={formData.supplier_name}
                  onChange={(value) => setFormData({...formData, supplier_name: value})}
                />
                
                <Input
                  label="Invoice Number"
                  value={formData.invoice_number}
                  onChange={(value) => setFormData({...formData, invoice_number: value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(value) => setFormData({...formData, purchase_date: value})}
                  required
                  error={formErrors.purchase_date}
                />
                
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(value) => setFormData({...formData, expiry_date: value})}
                />
              </div>
              
              <Input
                label="Notes"
                value={formData.notes}
                onChange={(value) => setFormData({...formData, notes: value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedPurchase(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Purchase
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}