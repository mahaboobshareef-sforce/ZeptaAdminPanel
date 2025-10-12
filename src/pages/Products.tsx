import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Package, Eye, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal, { ModalBody, ModalFooter } from '../components/UI/Modal';
import { 
  fetchProductsWithDetails,
  fetchCategories,
  updateProductStatus,
  updateProductFeatured,
  createProductWithVariants,
  updateProduct,
  updateProductVariant,
  createProductVariant,
  deleteProductVariant,
  deleteProduct
} from '../lib/supabase';
import { format } from 'date-fns';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    image_url: '',
    is_featured: false,
    variants: [
      { unit_label: '', price: '', discount_price: '', sku: '', base_unit_quantity: '', base_unit_type: 'weight', base_unit_label: 'kg' }
    ]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading products...');
      
      const [productsResult, categoriesResult] = await Promise.all([
        fetchProductsWithDetails(),
        fetchCategories()
      ]);
      
      if (productsResult.error) {
        throw new Error(productsResult.error.message || 'Failed to fetch products');
      }
      
      if (categoriesResult.error) {
        console.warn('Failed to fetch categories:', categoriesResult.error);
      }
      
      console.log('✅ Products loaded:', productsResult.data?.length || 0);
      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
      
    } catch (err) {
      console.error('❌ Products loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }
    
    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.unit_label.trim()) {
        errors[`variant_${index}_unit_label`] = 'Unit label is required';
      }
      if (!variant.price || Number(variant.price) <= 0) {
        errors[`variant_${index}_price`] = 'Valid price is required';
      }
      if (!variant.base_unit_quantity || Number(variant.base_unit_quantity) <= 0) {
        errors[`variant_${index}_base_unit_quantity`] = 'Valid base unit quantity is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        is_featured: formData.is_featured,
        is_active: true,
        variants: formData.variants.map(variant => ({
          unit_label: variant.unit_label,
          price: Number(variant.price),
          discount_price: variant.discount_price ? Number(variant.discount_price) : null,
          sku: variant.sku || null,
          base_unit_quantity: Number(variant.base_unit_quantity),
          base_unit_type: variant.base_unit_type,
          base_unit_label: variant.base_unit_label,
          status: 'active'
        }))
      };
      
      const result = await createProductWithVariants(productData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to create product');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to create product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !validateForm()) return;
    
    try {
      // Update product basic information
      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        is_featured: formData.is_featured
      };
      
      const result = await updateProduct(selectedProduct.id, productData);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update product');
      }
      
      // Update variants
      for (let i = 0; i < formData.variants.length; i++) {
        const variant = formData.variants[i];
        const existingVariant = selectedProduct.variants?.[i];
        
        const variantData = {
          unit_label: variant.unit_label,
          price: Number(variant.price),
          discount_price: variant.discount_price ? Number(variant.discount_price) : null,
          sku: variant.sku || null,
          base_unit_quantity: Number(variant.base_unit_quantity),
          base_unit_type: variant.base_unit_type,
          base_unit_label: variant.base_unit_label,
          status: 'active'
        };
        
        if (existingVariant) {
          // Update existing variant
          const variantResult = await updateProductVariant(existingVariant.id, variantData);
          if (variantResult.error) {
            console.error('Failed to update variant:', variantResult.error);
          }
        } else {
          // Create new variant
          const newVariantResult = await createProductVariant({
            ...variantData,
            product_id: selectedProduct.id
          });
          if (newVariantResult.error) {
            console.error('Failed to create variant:', newVariantResult.error);
          }
        }
      }
      
      // Delete removed variants
      if (selectedProduct.variants) {
        for (let i = formData.variants.length; i < selectedProduct.variants.length; i++) {
          const variantToDelete = selectedProduct.variants[i];
          const deleteResult = await deleteProductVariant(variantToDelete.id);
          if (deleteResult.error) {
            console.error('Failed to delete variant:', deleteResult.error);
          }
        }
      }
      
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      await loadData();
      
    } catch (err) {
      alert(`Failed to update product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      setFiltering(true);
      console.log(`🔄 Toggling product ${productId} status from ${currentStatus} to ${!currentStatus}`);
      
      const result = await updateProductStatus(productId, !currentStatus);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update product status');
      }
      
      console.log('✅ Product status updated successfully');
      
      // Update product in state without full reload
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, is_active: !currentStatus }
            : product
        )
      );
      
    } catch (err) {
      console.error('❌ Product status update failed:', err);
      alert(`Failed to update product status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFiltering(false);
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      setFiltering(true);
      console.log(`🔄 Toggling product ${productId} featured from ${currentFeatured} to ${!currentFeatured}`);
      
      const result = await updateProductFeatured(productId, !currentFeatured);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update product featured status');
      }
      
      console.log('✅ Product featured status updated successfully');
      
      // Update product in state without full reload
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, is_featured: !currentFeatured }
            : product
        )
      );
      
    } catch (err) {
      console.error('❌ Product featured update failed:', err);
      alert(`Failed to update product featured status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFiltering(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all its variants.')) return;
    
    try {
      const result = await deleteProduct(productId);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete product');
      }
      
      await loadData();
      
    } catch (err) {
      alert(`Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      image_url: '',
      is_featured: false,
      variants: [
        { unit_label: '', price: '', discount_price: '', sku: '', base_unit_quantity: '', base_unit_type: 'weight', base_unit_label: 'kg' }
      ]
    });
    setFormErrors({});
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_featured: product.is_featured || false,
      variants: product.variants?.map((v: any) => ({
        unit_label: v.unit_label || '',
        price: v.price?.toString() || '',
        discount_price: v.discount_price?.toString() || '',
        sku: v.sku || '',
        base_unit_quantity: v.base_unit_quantity?.toString() || '1',
        base_unit_type: v.base_unit_type || 'weight',
        base_unit_label: v.base_unit_label || 'kg'
      })) || [{ unit_label: '', price: '', discount_price: '', sku: '', base_unit_quantity: '1', base_unit_type: 'weight', base_unit_label: 'kg' }]
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (product: any) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const openVariantsModal = (product: any) => {
    setSelectedProduct(product);
    setShowVariantsModal(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { unit_label: '', price: '', discount_price: '', sku: '', base_unit_quantity: '', base_unit_type: 'weight', base_unit_label: 'kg' }]
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData({
        ...formData,
        variants: formData.variants.filter((_, i) => i !== index)
      });
    }
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    
    // Auto-update base_unit_label when base_unit_type changes
    if (field === 'base_unit_type') {
      const defaultLabels = {
        weight: 'kg',
        count: 'pieces',
        volume: 'liters'
      };
      updatedVariants[index].base_unit_label = defaultLabels[value as keyof typeof defaultLabels] || 'kg';
    }
    
    setFormData({ ...formData, variants: updatedVariants });
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = categoryFilter === 'all' || product.category_id === categoryFilter;
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active) ||
      (statusFilter === 'featured' && product.is_featured);
    return categoryMatch && statusMatch;
  });

  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="mb-2">Products Loading Error</CardTitle>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog ({products.length} total)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadData} disabled={loading} icon={RefreshCw}>
            Refresh
          </Button>
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setFiltering(true);
              setCategoryFilter(e.target.value);
              setTimeout(() => setFiltering(false), 100);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setFiltering(true);
              setStatusFilter(e.target.value);
              setTimeout(() => setFiltering(false), 100);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
          </select>
          
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.is_featured).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No Products Found</CardTitle>
            <p className="text-gray-600 mb-4">
              {products.length === 0 
                ? 'Get started by adding your first product.' 
                : 'No products match your current filters.'
              }
            </p>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Add First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {product.category?.name || 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.variants?.length || 0} variants</p>
                      <button
                        onClick={() => openVariantsModal(product)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        View Details
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(product.id, product.is_active)}
                      className="focus:outline-none"
                    >
                      {product.is_active ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <ToggleRight className="h-5 w-5" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <ToggleLeft className="h-5 w-5" />
                          <span className="text-sm font-medium">Inactive</span>
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          product.is_featured
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(product.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(product)} icon={Eye}>
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} icon={Edit}>
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} icon={Trash2}>
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

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Product"
        size="xl"
      >
        <form onSubmit={handleCreateProduct}>
          <ModalBody>
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Product Name"
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                    required
                    error={formErrors.name}
                    placeholder="e.g., Fresh Tomatoes"
                  />
                  
                  <Select
                    label="Category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    options={categoryOptions}
                    required
                    error={formErrors.category_id}
                    placeholder="Select category"
                  />
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Description"
                      value={formData.description}
                      onChange={(value) => setFormData({...formData, description: value})}
                      placeholder="Brief description of the product"
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    value={formData.image_url}
                    onChange={(value) => setFormData({...formData, image_url: value})}
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>

              {/* Product Variants */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    Add Variant
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                        {formData.variants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                          label="Unit Label"
                          value={variant.unit_label}
                          onChange={(value) => updateVariant(index, 'unit_label', value)}
                          required
                          error={formErrors[`variant_${index}_unit_label`]}
                          placeholder="e.g., 1kg, 500g"
                        />
                        
                        <Input
                          label="Price (₹)"
                          type="number"
                          value={variant.price}
                          onChange={(value) => updateVariant(index, 'price', value)}
                          required
                          error={formErrors[`variant_${index}_price`]}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        
                        <Input
                          label="Discount Price (₹)"
                          type="number"
                          value={variant.discount_price}
                          onChange={(value) => updateVariant(index, 'discount_price', value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        
                        <Input
                          label="SKU"
                          value={variant.sku}
                          onChange={(value) => updateVariant(index, 'sku', value)}
                          placeholder="Optional"
                        />
                        
                        <Input
                          label="Base Unit Quantity"
                          type="number"
                          value={variant.base_unit_quantity}
                          onChange={(value) => updateVariant(index, 'base_unit_quantity', value)}
                          required
                          error={formErrors[`variant_${index}_base_unit_quantity`]}
                          placeholder="1.0"
                          min="0"
                          step="0.01"
                        />
                        
                        <select
                          value={variant.base_unit_type}
                          onChange={(e) => updateVariant(index, 'base_unit_type', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="weight">Weight</option>
                          <option value="count">Count</option>
                          <option value="volume">Volume</option>
                        </select>
                        
                        <Input
                          label="Base Unit Label"
                          value={variant.base_unit_label}
                          onChange={(value) => updateVariant(index, 'base_unit_label', value)}
                          placeholder="kg, pieces, liters"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
              Create Product
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
          resetForm();
        }}
        title="Edit Product"
        size="xl"
      >
        <form onSubmit={handleUpdateProduct}>
          <ModalBody>
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Product Name"
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                    required
                    error={formErrors.name}
                  />
                  
                  <Select
                    label="Category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    options={categoryOptions}
                    required
                    error={formErrors.category_id}
                  />
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Description"
                      value={formData.description}
                      onChange={(value) => setFormData({...formData, description: value})}
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    value={formData.image_url}
                    onChange={(value) => setFormData({...formData, image_url: value})}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="edit_is_featured" className="text-sm font-medium text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>

              {/* Product Variants */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    Add Variant
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                        {formData.variants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                          label="Unit Label"
                          value={variant.unit_label}
                          onChange={(value) => updateVariant(index, 'unit_label', value)}
                          required
                          error={formErrors[`variant_${index}_unit_label`]}
                          placeholder="e.g., 1kg, 500g"
                        />
                        
                        <Input
                          label="Price (₹)"
                          type="number"
                          value={variant.price}
                          onChange={(value) => updateVariant(index, 'price', value)}
                          required
                          error={formErrors[`variant_${index}_price`]}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        
                        <Input
                          label="Discount Price (₹)"
                          type="number"
                          value={variant.discount_price}
                          onChange={(value) => updateVariant(index, 'discount_price', value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        
                        <Input
                          label="SKU"
                          value={variant.sku}
                          onChange={(value) => updateVariant(index, 'sku', value)}
                          placeholder="Optional"
                        />
                        
                        <Input
                          label="Base Unit Quantity"
                          type="number"
                          value={variant.base_unit_quantity}
                          onChange={(value) => updateVariant(index, 'base_unit_quantity', value)}
                          required
                          error={formErrors[`variant_${index}_base_unit_quantity`]}
                          placeholder="1.0"
                          min="0"
                          step="0.01"
                        />
                        
                        <select
                          value={variant.base_unit_type}
                          onChange={(e) => updateVariant(index, 'base_unit_type', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="weight">Weight</option>
                          <option value="count">Count</option>
                          <option value="volume">Volume</option>
                        </select>
                        
                        <Input
                          label="Base Unit Label"
                          value={variant.base_unit_label}
                          onChange={(value) => updateVariant(index, 'base_unit_label', value)}
                          placeholder="kg, pieces, liters"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t bg-gray-50">
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-600">
                {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} configured
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Update Product
                </Button>
              </div>
            </div>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProduct(null);
        }}
        title="Product Details"
        size="lg"
      >
        {selectedProduct && (
          <ModalBody>
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="h-32 w-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                  <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <Badge variant={selectedProduct.is_active ? 'success' : 'error'}>
                      {selectedProduct.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedProduct.is_featured && (
                      <Badge variant="warning">Featured</Badge>
                    )}
                    <Badge variant="info">
                      {selectedProduct.category?.name || 'Uncategorized'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Product Variants</h4>
                <div className="space-y-3">
                  {selectedProduct.variants?.map((variant: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{variant.unit_label}</p>
                        <p className="text-sm text-gray-600">SKU: {variant.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{Number(variant.price).toLocaleString()}</p>
                        {variant.discount_price && (
                          <p className="text-sm text-green-600">
                            Discount: ₹{Number(variant.discount_price).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Created:</span> {format(new Date(selectedProduct.created_at), 'PPP')}</p>
                  <p><span className="font-medium">Updated:</span> {format(new Date(selectedProduct.updated_at), 'PPP')}</p>
                </div>
                <div>
                  <p><span className="font-medium">Variants:</span> {selectedProduct.variants?.length || 0}</p>
                  <p><span className="font-medium">Category:</span> {selectedProduct.category?.name || 'None'}</p>
                </div>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>

      {/* Variants Modal */}
      <Modal
        isOpen={showVariantsModal}
        onClose={() => {
          setShowVariantsModal(false);
          setSelectedProduct(null);
        }}
        title={`Product Variants - ${selectedProduct?.name || ''}`}
        size="lg"
      >
        {selectedProduct && (
          <ModalBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Available Variants</h3>
                <Badge variant="info">
                  {selectedProduct.variants?.length || 0} variants
                </Badge>
              </div>
              
              {selectedProduct.variants?.map((variant: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{variant.unit_label}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>SKU: {variant.sku || 'N/A'}</span>
                      <Badge variant={variant.status === 'active' ? 'success' : 'error'}>
                        {variant.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">₹{Number(variant.price).toLocaleString()}</p>
                    {variant.discount_price && (
                      <p className="text-sm text-green-600">
                        Discounted: ₹{Number(variant.discount_price).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Button variant="ghost" size="sm" icon={Edit}>
                      <span className="sr-only">Edit variant</span>
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No variants found for this product.</p>
                </div>
              )}
            </div>
          </ModalBody>
        )}
      </Modal>
    </div>
  );
}