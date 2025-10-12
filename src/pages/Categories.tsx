import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../lib/supabase';
import { format } from 'date-fns';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    parent_id: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading categories...');
      
      const result = await fetchCategories();
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch categories');
      }
      
      console.log('✅ Categories loaded:', result.data?.length || 0);
      setCategories(result.data || []);
      
    } catch (err) {
      console.error('❌ Categories loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Category type is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await createCategory({
        name: formData.name,
        type: formData.type as 'vegetable' | 'grocery',
        parent_id: formData.parent_id || undefined
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create category');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadCategories();
      
    } catch (err) {
      alert(`Failed to create category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !validateForm()) return;
    
    try {
      const result = await updateCategory(selectedCategory.id, {
        name: formData.name,
        type: formData.type,
        parent_id: formData.parent_id || null
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update category');
      }
      
      setShowEditModal(false);
      setSelectedCategory(null);
      resetForm();
      await loadCategories();
      
    } catch (err) {
      alert(`Failed to update category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const result = await deleteCategory(categoryId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete category');
      }
      
      await loadCategories();
      
    } catch (err) {
      alert(`Failed to delete category: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: '', parent_id: '' });
    setFormErrors({});
  };

  const openEditModal = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      type: category.type || '',
      parent_id: category.parent_id || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const typeOptions = [
    { value: 'vegetable', label: 'Vegetable' },
    { value: 'grocery', label: 'Grocery' }
  ];

  const parentOptions = categories
    .filter(cat => !cat.parent_id)
    .map(cat => ({
      value: cat.id,
      label: cat.name
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Tag className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Categories Loading Error</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCategories}>
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories ({categories.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadCategories} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vegetables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.type === 'vegetable').length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Grocery</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.type === 'grocery').length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Categories Found</CardTitle>
            <p className="text-gray-600 mb-4">Get started by adding your first category.</p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Add First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Tag className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.type === 'vegetable' ? 'success' : 'info'}>
                      {category.type?.charAt(0).toUpperCase() + category.type?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.parent_id ? (
                      <span className="text-sm text-gray-600">
                        {categories.find(c => c.id === category.parent_id)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <Badge variant="default">Root Category</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(category.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(category)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} icon={Trash2}>
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

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Category"
        size="md"
      >
        <form onSubmit={handleCreateCategory}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Category Name"
                value={formData.name}
                onChange={(value) => setFormData({...formData, name: value})}
                required
                error={formErrors.name}
                placeholder="e.g., Fresh Vegetables, Dairy Products"
              />
              
              <Select
                label="Category Type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                options={typeOptions}
                required
                error={formErrors.type}
                placeholder="Select category type"
              />
              
              <Select
                label="Parent Category"
                value={formData.parent_id}
                onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                options={parentOptions}
                placeholder="Select parent category (Optional)"
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
              Create Category
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
          resetForm();
        }}
        title="Edit Category"
        size="md"
      >
        <form onSubmit={handleUpdateCategory}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Category Name"
                value={formData.name}
                onChange={(value) => setFormData({...formData, name: value})}
                required
                error={formErrors.name}
                placeholder="e.g., Fresh Vegetables, Dairy Products"
              />
              
              <Select
                label="Category Type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                options={typeOptions}
                required
                error={formErrors.type}
                placeholder="Select category type"
              />
              
              <Select
                label="Parent Category"
                value={formData.parent_id}
                onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                options={parentOptions}
                placeholder="Select parent category (Optional)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedCategory(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Category
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}