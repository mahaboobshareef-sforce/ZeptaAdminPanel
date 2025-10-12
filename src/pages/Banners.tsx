import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { fetchBanners, createBanner, updateBanner, deleteBanner } from '../lib/supabase';
import { format } from 'date-fns';

export default function Banners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_type: '',
    external_url: '',
    start_date: '',
    end_date: '',
    sort_order: '0'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchBanners();
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch banners');
      }
      
      setBanners(result.data || []);
      
    } catch (err) {
      console.error('❌ Banners loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.image_url.trim()) {
      errors.image_url = 'Image URL is required';
    }
    
    if (!formData.link_type) {
      errors.link_type = 'Link type is required';
    }
    
    if (formData.link_type === 'external' && !formData.external_url.trim()) {
      errors.external_url = 'External URL is required for external link type';
    }
    
    if (formData.sort_order && isNaN(Number(formData.sort_order))) {
      errors.sort_order = 'Sort order must be a number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const bannerData = {
        title: formData.title || null,
        image_url: formData.image_url,
        link_type: formData.link_type,
        external_url: formData.link_type === 'external' ? formData.external_url : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        sort_order: Number(formData.sort_order) || 0,
        status: 'active'
      };
      
      const result = await createBanner(bannerData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create banner');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadBanners();
      
    } catch (err) {
      alert(`Failed to create banner: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBanner || !validateForm()) return;
    
    try {
      const bannerData = {
        title: formData.title || null,
        image_url: formData.image_url,
        link_type: formData.link_type,
        external_url: formData.link_type === 'external' ? formData.external_url : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        sort_order: Number(formData.sort_order) || 0
      };
      
      const result = await updateBanner(selectedBanner.id, bannerData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update banner');
      }
      
      setShowEditModal(false);
      setSelectedBanner(null);
      resetForm();
      await loadBanners();
      
    } catch (err) {
      alert(`Failed to update banner: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const result = await deleteBanner(bannerId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete banner');
      }
      
      await loadBanners();
      
    } catch (err) {
      alert(`Failed to delete banner: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_type: '',
      external_url: '',
      start_date: '',
      end_date: '',
      sort_order: '0'
    });
    setFormErrors({});
  };

  const openEditModal = (banner: any) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title || '',
      image_url: banner.image_url || '',
      link_type: banner.link_type || '',
      external_url: banner.external_url || '',
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      sort_order: banner.sort_order?.toString() || '0'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const linkTypeOptions = [
    { value: 'external', label: 'External URL' },
    { value: 'product', label: 'Product' },
    { value: 'category', label: 'Category' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading banners...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Banners Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadBanners}>
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
          <h1 className="text-3xl font-bold text-gray-900">Promotional Banners</h1>
          <p className="text-gray-600">Manage promotional banners and advertisements ({banners.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadBanners} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Banner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Banners</p>
                <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Banners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.filter(b => b.status === 'active').length}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {banners.filter(b => b.start_date && new Date(b.start_date) > new Date()).length}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banners Table */}
      {banners.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Banners Found</CardTitle>
            <p className="text-gray-600 mb-4">Get started by creating your first promotional banner.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Create First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Link Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="h-12 w-20 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-20 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {banner.title || 'Untitled Banner'}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {banner.image_url}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="info">
                        {banner.link_type}
                      </Badge>
                      {banner.link_type === 'external' && banner.external_url && (
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {banner.start_date && (
                        <p>From: {format(new Date(banner.start_date), 'MMM dd')}</p>
                      )}
                      {banner.end_date && (
                        <p>To: {format(new Date(banner.end_date), 'MMM dd')}</p>
                      )}
                      {!banner.start_date && !banner.end_date && (
                        <span className="text-gray-400">Always active</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">
                      {banner.sort_order || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={banner.status === 'active' ? 'success' : 'error'}>
                      {banner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(banner.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(banner)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBanner(banner.id)} icon={Trash2}>
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

      {/* Create Banner Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Banner"
        size="lg"
      >
        <form onSubmit={handleCreateBanner}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Banner Title"
                value={formData.title}
                onChange={(value) => setFormData({...formData, title: value})}
                placeholder="e.g., Summer Sale 2024"
              />
              
              <Input
                label="Image URL"
                value={formData.image_url}
                onChange={(value) => setFormData({...formData, image_url: value})}
                required
                error={formErrors.image_url}
                placeholder="https://example.com/banner.jpg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Link Type"
                  value={formData.link_type}
                  onChange={(e) => setFormData({...formData, link_type: e.target.value})}
                  options={linkTypeOptions}
                  required
                  error={formErrors.link_type}
                  placeholder="Select link type"
                />
                
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(value) => setFormData({...formData, sort_order: value})}
                  error={formErrors.sort_order}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              {formData.link_type === 'external' && (
                <Input
                  label="External URL"
                  value={formData.external_url}
                  onChange={(value) => setFormData({...formData, external_url: value})}
                  required
                  error={formErrors.external_url}
                  placeholder="https://example.com"
                />
              )}
              
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
              Create Banner
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Banner Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBanner(null);
          resetForm();
        }}
        title="Edit Banner"
        size="lg"
      >
        <form onSubmit={handleUpdateBanner}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Banner Title"
                value={formData.title}
                onChange={(value) => setFormData({...formData, title: value})}
                placeholder="e.g., Summer Sale 2024"
              />
              
              <Input
                label="Image URL"
                value={formData.image_url}
                onChange={(value) => setFormData({...formData, image_url: value})}
                required
                error={formErrors.image_url}
                placeholder="https://example.com/banner.jpg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Link Type"
                  value={formData.link_type}
                  onChange={(e) => setFormData({...formData, link_type: e.target.value})}
                  options={linkTypeOptions}
                  required
                  error={formErrors.link_type}
                  placeholder="Select link type"
                />
                
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(value) => setFormData({...formData, sort_order: value})}
                  error={formErrors.sort_order}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              {formData.link_type === 'external' && (
                <Input
                  label="External URL"
                  value={formData.external_url}
                  onChange={(value) => setFormData({...formData, external_url: value})}
                  required
                  error={formErrors.external_url}
                  placeholder="https://example.com"
                />
              )}
              
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
                setSelectedBanner(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Banner
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}