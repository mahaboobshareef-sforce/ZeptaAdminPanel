import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseServiceRoleKey
  })
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env file')
}

// Single client instance using service role for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Dashboard stats
export async function getDashboardStats() {
  try {
    const [orders, customers, agents, products] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('users').select('*').eq('role', 'customer'),
      supabase.from('users').select('*').eq('role', 'delivery_agent'),
      supabase.from('products').select('*')
    ])

    const totalRevenue = orders.data
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (parseFloat(o.order_total) || 0), 0) || 0

    return {
      totalOrders: orders.data?.length || 0,
      todaysOrders: 0,
      totalCustomers: customers.data?.length || 0,
      totalAgents: agents.data?.length || 0,
      totalProducts: products.data?.length || 0,
      activeProducts: products.data?.filter(p => p.is_active).length || 0,
      totalRevenue,
      pendingOrders: orders.data?.filter(o => o.status === 'pending').length || 0,
      deliveredOrders: orders.data?.filter(o => o.status === 'delivered').length || 0
    }
  } catch (error) {
    console.error('Stats error:', error)
    return {
      totalOrders: 0,
      todaysOrders: 0,
      totalCustomers: 0,
      totalAgents: 0,
      totalProducts: 0,
      activeProducts: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      deliveredOrders: 0
    }
  }
}

// Orders
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!customer_id(*),
      store:stores(*),
      delivery_address:customer_addresses(*),
      order_items(*, variant:product_variants(*, product:products(*))),
      payments(*)
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
  
  return { data, error }
}

export async function assignDeliveryAgent(orderId: string, agentId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      delivery_agent_id: agentId,
      status: 'assigned_delivery_partner',
      status_updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
  
  return { data, error }
}

// Products
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function fetchProductsWithDetails() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function updateProductStatus(productId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select()
  
  return { data, error }
}

export async function updateProductFeatured(productId: string, isFeatured: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)
    .select()
  
  return { data, error }
}

export async function createProductWithVariants(productData: any) {
  const { variants, ...product } = productData
  
  const { data: productResult, error: productError } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  
  if (productError) return { data: null, error: productError }
  
  if (variants && variants.length > 0) {
    const variantsWithProductId = variants.map((variant: any) => ({
      ...variant,
      product_id: productResult.id
    }))
    
    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsWithProductId)
    
    if (variantsError) return { data: null, error: variantsError }
  }
  
  return { data: productResult, error: null }
}

export async function updateProduct(productId: string, productData: any) {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select()
  
  return { data, error }
}

export async function updateProductVariant(variantId: string, variantData: any) {
  const { data, error } = await supabase
    .from('product_variants')
    .update(variantData)
    .eq('id', variantId)
    .select()
  
  return { data, error }
}

export async function createProductVariant(variantData: any) {
  const { data, error } = await supabase
    .from('product_variants')
    .insert(variantData)
    .select()
  
  return { data, error }
}

export async function deleteProductVariant(variantId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)
  
  return { data, error }
}

export async function deleteProduct(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
  
  return { data, error }
}

// Categories
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createCategory(categoryData: any) {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
  
  return { data, error }
}

export async function updateCategory(categoryId: string, categoryData: any) {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', categoryId)
    .select()
  
  return { data, error }
}

export async function deleteCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
  
  return { data, error }
}

// Users
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
  
  return { data, error }
}

// Delivery Agents
export async function fetchDeliveryAgents() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      store:stores(*),
      agent_location:agent_locations(*)
    `)
    .eq('role', 'delivery_agent')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createDeliveryAgent(agentData: any) {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-delivery-agent`;

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: agentData.full_name,
        email: agentData.email,
        mobile_number: agentData.mobile_number,
        store_id: agentData.store_id
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: result.error || 'Failed to create delivery agent' } };
    }

    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Failed to create delivery agent' } };
  }
}

export async function updateDeliveryAgent(agentId: string, agentData: any) {
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: agentData.full_name,
      email: agentData.email,
      mobile_number: agentData.mobile_number,
      store_id: agentData.store_id || null
    })
    .eq('id', agentId)
    .select()
  
  return { data, error }
}

export async function updateDeliveryAgentStatus(agentId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', agentId)
    .select()
  
  return { data, error }
}

export async function deleteDeliveryAgent(agentId: string) {
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', agentId)
  
  if (profileError) return { data: null, error: profileError }
  
  const { error: authError } = await supabase.auth.admin.deleteUser(agentId)
  
  return { data: { id: agentId }, error: authError }
}

export async function getAgentStats(agentId: string) {
  const [ordersResult, ratingsResult] = await Promise.all([
    supabase.from('orders').select('*').eq('delivery_agent_id', agentId),
    supabase.from('agent_ratings').select('rating').eq('agent_id', agentId)
  ])
  
  const deliveredOrders = ordersResult.data?.filter(o => o.status === 'delivered').length || 0
  const totalOrders = ordersResult.data?.length || 0
  const ratings = ratingsResult.data || []
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0
  
  return {
    data: {
      deliveredOrders,
      totalOrders,
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: ratings.length
    },
    error: null
  }
}

// Stores
export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createStore(storeData: any) {
  const { data, error } = await supabase
    .from('stores')
    .insert(storeData)
    .select()
  
  return { data, error }
}

export async function updateStore(storeId: string, storeData: any) {
  const { data, error } = await supabase
    .from('stores')
    .update(storeData)
    .eq('id', storeId)
    .select()
  
  return { data, error }
}

export async function deleteStore(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId)
  
  return { data, error }
}

// Banners
export async function fetchBanners() {
  const { data, error } = await supabase
    .from('promotional_banners')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createBanner(bannerData: any) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .insert(bannerData)
    .select()
  
  return { data, error }
}

export async function updateBanner(bannerId: string, bannerData: any) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .update(bannerData)
    .eq('id', bannerId)
    .select()
  
  return { data, error }
}

export async function deleteBanner(bannerId: string) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .delete()
    .eq('id', bannerId)
  
  return { data, error }
}

// Coupons
export async function fetchCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createCoupon(couponData: any) {
  const { data, error } = await supabase
    .from('coupons')
    .insert(couponData)
    .select()
  
  return { data, error }
}

export async function updateCoupon(couponId: string, couponData: any) {
  const { data, error } = await supabase
    .from('coupons')
    .update(couponData)
    .eq('id', couponId)
    .select()
  
  return { data, error }
}

export async function deleteCoupon(couponId: string) {
  const { data, error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
  
  return { data, error }
}

// Helper to sanitize bulk inventory payloads (remove derived fields)
export function sanitizeBulkPayload(row: any) {
  const {
    available_quantity,   // derived - REMOVE
    product_name,         // from view - REMOVE
    description,          // from view - REMOVE  
    ...safe
  } = row ?? {};
  return safe;
}

// Bulk Inventory
export async function fetchBulkInventory() {
  const { data, error } = await supabase
    .from('v_bulk_inventory')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getBulkInventoryByStore(storeId: string) {
  const { data, error } = await supabase
    .from('bulk_inventory')
    .select(`
      *,
      product:products(*,
        category:categories(*),
        variants:product_variants(*)
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Purchase Records
export async function fetchPurchaseRecords() {
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      *,
      store:stores(*),
      product:products(*)
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createPurchaseRecord(purchaseData: any) {
  const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  
  const { data, error } = await supabase
    .from('purchase_records')
    .insert({
      ...purchaseData,
      batch_number: batchNumber,
      remaining_quantity: purchaseData.quantity
    })
    .select()
  
  return { data, error }
}

export async function updatePurchaseRecord(recordId: string, purchaseData: any) {
  const { data, error } = await supabase
    .from('purchase_records')
    .update(purchaseData)
    .eq('id', recordId)
    .select()
  
  return { data, error }
}

export async function deletePurchaseRecord(recordId: string) {
  const { data, error } = await supabase
    .from('purchase_records')
    .delete()
    .eq('id', recordId)
  
  return { data, error }
}

// Check product stock availability
export async function checkProductStock(storeId: string, productId: string) {
  try {
    const { data, error } = await supabase
      .from('bulk_inventory')
      .select('total_quantity, reserved_quantity, available_quantity, weighted_avg_cost, unit_label')
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .maybeSingle()
    
    if (error) {
      console.error('Stock check error:', error)
      return { hasStock: false, availableQuantity: 0, error: error.message }
    }
    
    if (!data) {
      return { 
        hasStock: false, 
        availableQuantity: 0, 
        message: 'No bulk inventory found for this product',
        error: null 
      }
    }
    
    const available = Number(data.available_quantity || 0)
    
    return { 
      hasStock: available > 0, 
      availableQuantity: available,
      avgCost: Number(data.weighted_avg_cost || 0),
      unitLabel: data.unit_label || 'kg',
      message: available > 0 
        ? `Available: ${available.toFixed(2)} ${data.unit_label || 'kg'}`
        : 'No stock available',
      error: null 
    }
  } catch (error) {
    console.error('Stock check exception:', error)
    return { 
      hasStock: false, 
      availableQuantity: 0, 
      error: 'Failed to check stock availability' 
    }
  }
}

// Inventory Adjustments
export async function fetchInventoryAdjustments() {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select(`
      *,
      store:stores(*),
      product:products(*),
      adjusted_by_user:users!adjusted_by(*)
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createInventoryAdjustment(adjustmentData: any) {
  // Apply the adjustment to bulk inventory immediately
  const { error: adjustError } = await supabase.rpc('apply_inventory_adjustment', {
    p_store_id: adjustmentData.store_id,
    p_product_id: adjustmentData.product_id,
    p_adjustment_type: adjustmentData.adjustment_type,
    p_quantity: adjustmentData.quantity_adjusted,
    p_cost_impact: adjustmentData.cost_impact,
    p_reason: adjustmentData.reason,
    p_adjusted_by: adjustmentData.adjusted_by
  });
  
  if (adjustError) {
    return { data: null, error: adjustError };
  }
  
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .insert(adjustmentData)
    .select()
  
  return { data, error }
}

export async function updateInventoryAdjustment(adjustmentId: string, adjustmentData: any) {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .update(adjustmentData)
    .eq('id', adjustmentId)
    .select()
  
  return { data, error }
}

export async function deleteInventoryAdjustment(adjustmentId: string) {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .delete()
    .eq('id', adjustmentId)
  
  return { data, error }
}

// Product Variants
export async function fetchProductVariants() {
  const { data, error } = await supabase
    .from('product_variants')
    .select(`
      *,
      product:products(*,
        category:categories(*)
      )
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Profit Analysis
export async function getProfitAnalysis(storeId?: string) {
  let query = supabase.from('profit_analysis').select('*')
  
  if (storeId) {
    query = query.eq('store_id', storeId)
  }
  
  const { data, error } = await query.order('net_profit', { ascending: false })
  
  return { data, error }
}

export async function getProductProfitDetails(productId: string, storeId: string) {
  const { data, error } = await supabase
    .from('purchase_records')
    .select('*')
    .eq('product_id', productId)
    .eq('store_id', storeId)
    .order('purchase_date', { ascending: false })
  
  return { data, error }
}

// Calculate variant availability from bulk inventory
export async function calculateVariantAvailability(storeId: string, variantId: string) {
  try {
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('*, product:products(*)')
      .eq('id', variantId)
      .single()
    
    if (variantError) return { data: 0, error: variantError }
    
    const { data: bulkStock, error: bulkError } = await supabase
      .from('bulk_inventory')
      .select('total_quantity, reserved_quantity')
      .eq('store_id', storeId)
      .eq('product_id', variant.product_id)
      .single()
    
    if (bulkError || !bulkStock) return { data: 0, error: null }
    
    const availableQuantity = (bulkStock.total_quantity || 0) - (bulkStock.reserved_quantity || 0)
    const baseUnitQuantity = variant.base_unit_quantity || 1.0
    const availableVariants = Math.floor(availableQuantity / baseUnitQuantity)
    
    return { data: availableVariants, error: null }
  } catch (error) {
    return { data: 0, error }
  }
}

export async function getAllVariantAvailability(storeId: string) {
  try {
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*, product:products(*)')
      .eq('status', 'active')
    
    if (variantsError) throw variantsError
    
    const availability: Record<string, number> = {}
    
    for (const variant of variants || []) {
      const result = await calculateVariantAvailability(storeId, variant.id)
      availability[variant.id] = result.data || 0
    }
    
    return { data: availability, error: null }
  } catch (error) {
    return { data: {}, error }
  }
}