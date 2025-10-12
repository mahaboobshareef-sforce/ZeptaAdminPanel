import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { fetchStores, createStore, updateStore, deleteStore } from '../lib/supabase';
import { format } from 'date-fns';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius_km: '5',
    contact_number: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchStores();
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch stores');
      }
      
      setStores(result.data || []);
      
    } catch (err) {
      console.error('❌ Stores loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Store name is required';
    }
    
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      errors.latitude = 'Valid latitude is required (-90 to 90)';
    }
    
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      errors.longitude = 'Valid longitude is required (-180 to 180)';
    }
    
    if (formData.radius_km && (isNaN(Number(formData.radius_km)) || Number(formData.radius_km) <= 0)) {
      errors.radius_km = 'Valid radius is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const storeData = {
        name: formData.name,
        address: formData.address || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        radius_km: formData.radius_km ? Number(formData.radius_km) : 5,
        contact_number: formData.contact_number || null,
        status: 'active'
      };
      
      const result = await createStore(storeData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create store');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadStores();
      
    } catch (err) {
      alert(`Failed to create store: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !validateForm()) return;
    
    try {
      const storeData = {
        name: formData.name,
        address: formData.address || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        radius_km: formData.radius_km ? Number(formData.radius_km) : 5,
        contact_number: formData.contact_number || null
      };
      
      const result = await updateStore(selectedStore.id, storeData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update store');
      }
      
      setShowEditModal(false);
      setSelectedStore(null);
      resetForm();
      await loadStores();
      
    } catch (err) {
      alert(`Failed to update store: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    
    try {
      const result = await deleteStore(storeId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete store');
      }
      
      await loadStores();
      
    } catch (err) {
      alert(`Failed to delete store: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius_km: '5',
      contact_number: ''
    });
    setFormErrors({});
  };

  const openEditModal = (store: any) => {
    setSelectedStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
      radius_km: store.radius_km?.toString() || '5',
      contact_number: store.contact_number || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading stores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Stores Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadStores}>
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
          <h1 className="text-3xl font-bold text-gray-900">Stores Management</h1>
          <p className="text-gray-600">Manage store locations and coverage areas ({stores.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadStores} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Store
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stores</p>
                <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Stores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.filter(s => s.status === 'active').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Coverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.length > 0 
                    ? (stores.reduce((sum, s) => sum + (s.radius_km || 0), 0) / stores.length).toFixed(1)
                    : 0
                  } km
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      {stores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Stores Found</CardTitle>
            <p className="text-gray-600 mb-4">Get started by adding your first store location.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Add First Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {store.address}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {store.latitude && store.longitude ? (
                      <div className="text-sm">
                        <p>Lat: {store.latitude}</p>
                        <p>Lng: {store.longitude}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {store.radius_km || 0} km radius
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {store.contact_number || 'Not provided'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={store.status === 'active' ? 'success' : 'error'}>
                      {store.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(store.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(store)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteStore(store.id)} icon={Trash2}>
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

      {/* Create Store Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Store"
        size="md"
      >
        <form onSubmit={handleCreateStore}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Store Name"
                value={formData.name}
                onChange={(value) => setFormData({...formData, name: value})}
                required
                error={formErrors.name}
                placeholder="e.g., FreshMart Downtown"
              />
              
              <Input
                label="Address"
                value={formData.address}
                onChange={(value) => setFormData({...formData, address: value})}
                placeholder="Full store address"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={(value) => setFormData({...formData, latitude: value})}
                  error={formErrors.latitude}
                  placeholder="0.000000"
                  step="any"
                />
                
                <Input
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={(value) => setFormData({...formData, longitude: value})}
                  error={formErrors.longitude}
                  placeholder="0.000000"
                  step="any"
                />
              </div>
              
              <Input
                label="Coverage Radius (km)"
                type="number"
                value={formData.radius_km}
                onChange={(value) => setFormData({...formData, radius_km: value})}
                error={formErrors.radius_km}
                placeholder="5"
                min="0.1"
                step="0.1"
              />
              
              <Input
                label="Contact Number"
                type="tel"
                value={formData.contact_number}
                onChange={(value) => setFormData({...formData, contact_number: value})}
                placeholder="+91 9876543210"
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
              Create Store
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Store Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStore(null);
          resetForm();
        }}
        title="Edit Store"
        size="md"
      >
        <form onSubmit={handleUpdateStore}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Store Name"
                value={formData.name}
                onChange={(value) => setFormData({...formData, name: value})}
                required
                error={formErrors.name}
                placeholder="e.g., FreshMart Downtown"
              />
              
              <Input
                label="Address"
                value={formData.address}
                onChange={(value) => setFormData({...formData, address: value})}
                placeholder="Full store address"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={(value) => setFormData({...formData, latitude: value})}
                  error={formErrors.latitude}
                  placeholder="0.000000"
                  step="any"
                />
                
                <Input
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={(value) => setFormData({...formData, longitude: value})}
                  error={formErrors.longitude}
                  placeholder="0.000000"
                  step="any"
                />
              </div>
              
              <Input
                label="Coverage Radius (km)"
                type="number"
                value={formData.radius_km}
                onChange={(value) => setFormData({...formData, radius_km: value})}
                error={formErrors.radius_km}
                placeholder="5"
                min="0.1"
                step="0.1"
              />
              
              <Input
                label="Contact Number"
                type="tel"
                value={formData.contact_number}
                onChange={(value) => setFormData({...formData, contact_number: value})}
                placeholder="+91 9876543210"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedStore(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Store
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}