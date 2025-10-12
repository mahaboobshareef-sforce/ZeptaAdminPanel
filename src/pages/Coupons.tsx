import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from '../lib/supabase';
import { format } from 'date-fns';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: '',
    discount_value: '',
    min_order_value: '0',
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchCoupons();
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch coupons');
      }
      
      setCoupons(result.data || []);
      
    } catch (err) {
      console.error('❌ Coupons loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      errors.code = 'Coupon code is required';
    }
    
    if (!formData.discount_type) {
      errors.discount_type = 'Discount type is required';
    }
    
    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      errors.discount_value = 'Valid discount value is required';
    }
    
    if (formData.discount_type === 'percentage' && Number(formData.discount_value) > 100) {
      errors.discount_value = 'Percentage discount cannot exceed 100%';
    }
    
    if (formData.min_order_value && Number(formData.min_order_value) < 0) {
      errors.min_order_value = 'Minimum order value cannot be negative';
    }
    
    if (formData.usage_limit && Number(formData.usage_limit) <= 0) {
      errors.usage_limit = 'Usage limit must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value) || 0,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        used_count: 0,
        status: 'active'
      };
      
      const result = await createCoupon(couponData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create coupon');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadCoupons();
      
    } catch (err) {
      alert(`Failed to create coupon: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon || !validateForm()) return;
    
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value) || 0,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      const result = await updateCoupon(selectedCoupon.id, couponData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update coupon');
      }
      
      setShowEditModal(false);
      setSelectedCoupon(null);
      resetForm();
      await loadCoupons();
      
    } catch (err) {
      alert(`Failed to update coupon: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const result = await deleteCoupon(couponId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete coupon');
      }
      
      await loadCoupons();
      
    } catch (err) {
      alert(`Failed to delete coupon: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: '',
      discount_value: '',
      min_order_value: '0',
      max_discount: '',
      usage_limit: '',
      start_date: '',
      end_date: ''
    });
    setFormErrors({});
  };

  const openEditModal = (coupon: any) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || '',
      discount_value: coupon.discount_value?.toString() || '',
      min_order_value: coupon.min_order_value?.toString() || '0',
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const discountTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed Amount' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading coupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Percent className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Coupons Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCoupons}>
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
          <h1 className="text-3xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-gray-600">Manage promotional coupons and discount codes ({coupons.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadCoupons} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
              </div>
              <Percent className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Percent className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter(c => c.end_date && new Date(c.end_date) < new Date()).length}
                </p>
              </div>
              <Percent className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Coupons Found</CardTitle>
            <p className="text-gray-600 mb-4">Get started by creating your first promotional coupon.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Create First Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono font-bold text-indigo-600">{coupon.code}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {coupon.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : `₹${coupon.discount_value}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        Min: ₹{coupon.min_order_value || 0}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{coupon.used_count || 0}</p>
                      <p className="text-sm text-gray-500">
                        {coupon.usage_limit ? `/ ${coupon.usage_limit}` : '/ Unlimited'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.start_date && (
                        <p>From: {format(new Date(coupon.start_date), 'MMM dd')}</p>
                      )}
                      {coupon.end_date && (
                        <p>To: {format(new Date(coupon.end_date), 'MMM dd')}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.status === 'active' ? 'success' : 'error'}>
                      {coupon.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(coupon.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(coupon)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCoupon(coupon.id)} icon={Trash2}>
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

      {/* Create Coupon Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Coupon"
        size="lg"
      >
        <form onSubmit={handleCreateCoupon}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Coupon Code"
                  value={formData.code}
                  onChange={(value) => setFormData({...formData, code: value.toUpperCase()})}
                  required
                  error={formErrors.code}
                  placeholder="SAVE20"
                />
                
                <Select
                  label="Discount Type"
                  value={formData.discount_type}
                  onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  options={discountTypeOptions}
                  required
                  error={formErrors.discount_type}
                  placeholder="Select type"
                />
              </div>
              
              <Input
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({...formData, description: value})}
                placeholder="Brief description of the coupon"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Discount Value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(value) => setFormData({...formData, discount_value: value})}
                  required
                  error={formErrors.discount_value}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                />
                
                <Input
                  label="Minimum Order Value"
                  type="number"
                  value={formData.min_order_value}
                  onChange={(value) => setFormData({...formData, min_order_value: value})}
                  error={formErrors.min_order_value}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Maximum Discount (₹)"
                  type="number"
                  value={formData.max_discount}
                  onChange={(value) => setFormData({...formData, max_discount: value})}
                  placeholder="Optional for percentage type"
                  min="0"
                />
                
                <Input
                  label="Usage Limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(value) => setFormData({...formData, usage_limit: value})}
                  error={formErrors.usage_limit}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(value) => setFormData({...formData, start_date: value})}
                />
                
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(value) => setFormData({...formData, end_date: value})}
                />
              </div>
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
              Create Coupon
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCoupon(null);
          resetForm();
        }}
        title="Edit Coupon"
        size="lg"
      >
        <form onSubmit={handleUpdateCoupon}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Coupon Code"
                  value={formData.code}
                  onChange={(value) => setFormData({...formData, code: value.toUpperCase()})}
                  required
                  error={formErrors.code}
                  placeholder="SAVE20"
                />
                
                <Select
                  label="Discount Type"
                  value={formData.discount_type}
                  onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  options={discountTypeOptions}
                  required
                  error={formErrors.discount_type}
                  placeholder="Select type"
                />
              </div>
              
              <Input
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({...formData, description: value})}
                placeholder="Brief description of the coupon"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Discount Value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(value) => setFormData({...formData, discount_value: value})}
                  required
                  error={formErrors.discount_value}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                />
                
                <Input
                  label="Minimum Order Value"
                  type="number"
                  value={formData.min_order_value}
                  onChange={(value) => setFormData({...formData, min_order_value: value})}
                  error={formErrors.min_order_value}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Maximum Discount (₹)"
                  type="number"
                  value={formData.max_discount}
                  onChange={(value) => setFormData({...formData, max_discount: value})}
                  placeholder="Optional for percentage type"
                  min="0"
                />
                
                <Input
                  label="Usage Limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(value) => setFormData({...formData, usage_limit: value})}
                  error={formErrors.usage_limit}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(value) => setFormData({...formData, start_date: value})}
                />
                
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(value) => setFormData({...formData, end_date: value})}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedCoupon(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Coupon
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}