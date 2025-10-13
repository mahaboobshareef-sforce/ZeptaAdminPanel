import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

type DashboardStats = {
  totalOrders: number;
  todaysOrders: number;
  totalCustomers: number;
  totalAgents: number;
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [orders, customers, agents, products] = await Promise.all([
      supabase.from('orders').select('status, order_total'),
      supabase.from('users').select('id').eq('role', 'customer'),
      supabase.from('users').select('id').eq('role', 'delivery_agent'),
      supabase.from('products').select('id, is_active')
    ]);

    const totalRevenue = orders.data
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.order_total) || 0), 0) || 0;

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
    };
  } catch (error) {
    console.error('Stats error:', error);
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
    };
  }
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!customer_id(id, full_name, email, mobile_number),
      store:stores!store_id(id, name),
      delivery_agent:users!delivery_agent_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select();

  return { data, error };
}

export async function assignDeliveryAgent(orderId: string, agentId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      delivery_agent_id: agentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select();

  return { data, error };
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchProductsWithDetails() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      variants:product_variants(*)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateProductStatus(productId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select();

  return { data, error };
}

export async function updateProductFeatured(productId: string, isFeatured: boolean) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)
    .select();

  return { data, error };
}

export async function createProductWithVariants(productData: { variants?: any[]; [key: string]: any }) {
  const { variants, ...product } = productData;

  const { data: productResult, error: productError } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (productError) return { data: null, error: productError };

  if (variants && variants.length > 0) {
    const variantsWithProductId = variants.map((variant) => ({
      ...variant,
      product_id: productResult.id
    }));

    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsWithProductId);

    if (variantsError) return { data: null, error: variantsError };
  }

  return { data: productResult, error: null };
}

export async function updateProduct(productId: string, productData: Record<string, any>) {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select();

  return { data, error };
}

export async function deleteProduct(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  return { data, error };
}

export async function updateProductVariant(variantId: string, variantData: Record<string, any>) {
  const { data, error } = await supabase
    .from('product_variants')
    .update(variantData)
    .eq('id', variantId)
    .select();

  return { data, error };
}

export async function createProductVariant(variantData: Record<string, any>) {
  const { data, error } = await supabase
    .from('product_variants')
    .insert(variantData)
    .select();

  return { data, error };
}

export async function deleteProductVariant(variantId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId);

  return { data, error };
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, parent_id, created_at, updated_at')
    .order('name', { ascending: true });

  if (data && !error) {
    return {
      data: data.map(cat => ({
        ...cat,
        parent_category_id: cat.parent_id,
        description: '',
        image_url: '',
        is_active: true,
        display_order: 0
      })),
      error
    };
  }

  return { data, error };
}

export async function createCategory(categoryData: Record<string, any>) {
  const { parent_category_id, ...dbData } = categoryData;
  const insertData = {
    ...dbData,
    parent_id: parent_category_id || null
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(insertData)
    .select();

  return { data, error };
}

export async function updateCategory(categoryId: string, categoryData: Record<string, any>) {
  const { parent_category_id, ...dbData } = categoryData;
  const updateData = {
    ...dbData,
    parent_id: parent_category_id || null
  };

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', categoryId)
    .select();

  return { data, error };
}

export async function deleteCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  return { data, error };
}

export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createStore(storeData: Record<string, any>) {
  const { data, error } = await supabase
    .from('stores')
    .insert(storeData)
    .select();

  return { data, error };
}

export async function updateStore(storeId: string, storeData: Record<string, any>) {
  const { data, error } = await supabase
    .from('stores')
    .update(storeData)
    .eq('id', storeId)
    .select();

  return { data, error };
}

export async function deleteStore(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId);

  return { data, error };
}

export async function fetchInventory() {
  const { data, error } = await supabase
    .from('store_inventory')
    .select(`
      *,
      product:products(id, name, sku),
      variant:product_variants(id, name),
      store:stores(id, name)
    `)
    .order('updated_at', { ascending: false });

  return { data, error };
}

export async function fetchProductVariants() {
  const { data, error } = await supabase
    .from('product_variants')
    .select(`
      *,
      product:products(id, name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchBulkInventory() {
  const { data, error } = await supabase
    .from('bulk_inventory')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchPurchaseRecords() {
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      *,
      store:stores(id, name),
      product:products(id, name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createPurchaseRecord(purchaseData: Record<string, any>) {
  const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const { data, error } = await supabase
    .from('purchase_records')
    .insert({
      ...purchaseData,
      batch_number: batchNumber,
      remaining_quantity: purchaseData.quantity
    })
    .select();

  return { data, error };
}

export async function updatePurchaseRecord(recordId: string, purchaseData: Record<string, any>) {
  const { data, error } = await supabase
    .from('purchase_records')
    .update(purchaseData)
    .eq('id', recordId)
    .select();

  return { data, error };
}

export async function deletePurchaseRecord(recordId: string) {
  const { data, error } = await supabase
    .from('purchase_records')
    .delete()
    .eq('id', recordId);

  return { data, error };
}

export async function fetchInventoryAdjustments() {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select(`
      *,
      store:stores(id, name),
      product:products(id, name),
      adjusted_by_user:users!adjusted_by(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createInventoryAdjustment(adjustmentData: Record<string, any>) {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .insert(adjustmentData)
    .select();

  return { data, error };
}

export async function updateInventoryAdjustment(adjustmentId: string, adjustmentData: Record<string, any>) {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .update(adjustmentData)
    .eq('id', adjustmentId)
    .select();

  return { data, error };
}

export async function deleteInventoryAdjustment(adjustmentId: string) {
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .delete()
    .eq('id', adjustmentId);

  return { data, error };
}

export async function fetchPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      order:orders(id, order_number, customer:users!customer_id(id, full_name))
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchRefunds() {
  const { data, error } = await supabase
    .from('refunds')
    .select(`
      *,
      order:orders(id, order_number),
      payment:payments(id, transaction_id)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createRefund(refundData: Record<string, any>) {
  const { data, error } = await supabase
    .from('refunds')
    .insert(refundData)
    .select();

  return { data, error };
}

export async function updateRefundStatus(refundId: string, status: string, processedBy?: string) {
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (processedBy) {
    updateData.processed_by = processedBy;
  }

  const { data, error } = await supabase
    .from('refunds')
    .update(updateData)
    .eq('id', refundId)
    .select();

  return { data, error };
}

export async function fetchCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createCoupon(couponData: Record<string, any>) {
  const { data, error } = await supabase
    .from('coupons')
    .insert(couponData)
    .select();

  return { data, error };
}

export async function updateCoupon(couponId: string, couponData: Record<string, any>) {
  const { data, error } = await supabase
    .from('coupons')
    .update(couponData)
    .eq('id', couponId)
    .select();

  return { data, error };
}

export async function deleteCoupon(couponId: string) {
  const { data, error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId);

  return { data, error };
}

export async function fetchBanners() {
  const { data, error } = await supabase
    .from('promotional_banners')
    .select('*')
    .order('sort_order', { ascending: true });

  return { data, error };
}

export async function createBanner(bannerData: Record<string, any>) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .insert(bannerData)
    .select();

  return { data, error };
}

export async function updateBanner(bannerId: string, bannerData: Record<string, any>) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .update(bannerData)
    .eq('id', bannerId)
    .select();

  return { data, error };
}

export async function deleteBanner(bannerId: string) {
  const { data, error } = await supabase
    .from('promotional_banners')
    .delete()
    .eq('id', bannerId);

  return { data, error };
}

export async function fetchRatings() {
  const { data, error } = await supabase
    .from('ratings_reviews')
    .select(`
      *,
      product:products(id, name),
      user:users!user_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function fetchSupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      user:users!user_id(id, full_name, email),
      assigned_user:users!assigned_to(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createSupportTicket(ticketData: Record<string, any>) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(ticketData)
    .select();

  return { data, error };
}

export async function updateSupportTicket(ticketId: string, ticketData: Record<string, any>) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update(ticketData)
    .eq('id', ticketId)
    .select();

  return { data, error };
}

export async function fetchDeliveryAgents() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      store:stores(id, name)
    `)
    .eq('role', 'delivery_agent')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createDeliveryAgent(agentData: Record<string, any>) {
  try {
    const apiUrl = `${supabaseUrl}/functions/v1/create-delivery-agent`;

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
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
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Failed to create delivery agent' }
    };
  }
}

export async function updateDeliveryAgent(agentId: string, agentData: Record<string, any>) {
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: agentData.full_name,
      email: agentData.email,
      mobile_number: agentData.mobile_number,
      store_id: agentData.store_id || null
    })
    .eq('id', agentId)
    .select();

  return { data, error };
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select();

  return { data, error };
}

export async function getAgentStats(agentId: string) {
  const [ordersResult] = await Promise.all([
    supabase.from('orders').select('id, status').eq('delivery_agent_id', agentId)
  ]);

  const deliveredOrders = ordersResult.data?.filter(o => o.status === 'delivered').length || 0;
  const totalOrders = ordersResult.data?.length || 0;

  return {
    data: {
      deliveredOrders,
      totalOrders,
      averageRating: 0,
      totalRatings: 0
    },
    error: null
  };
}

export async function updateDeliveryAgentStatus(agentId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', agentId)
    .select();

  return { data, error };
}

export async function deleteDeliveryAgent(agentId: string) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', agentId);

  return { data, error };
}

export async function getProfitAnalysis(storeId?: string) {
  try {
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchase_records')
      .select(`
        *,
        product:products!inner(id, name),
        store:stores!inner(id, name)
      `);

    if (purchaseError) throw purchaseError;

    const { data: inventoryData, error: inventoryError } = await supabase
      .from('bulk_inventory')
      .select('*');

    if (inventoryError) throw inventoryError;

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('status', 'delivered');

    if (ordersError) throw ordersError;

    const profitMap = new Map();

    purchaseData?.forEach((purchase: any) => {
      const key = `${purchase.product_id}_${purchase.store_id}`;
      if (!profitMap.has(key)) {
        profitMap.set(key, {
          product_id: purchase.product_id,
          product_name: purchase.product?.name || 'Unknown',
          store_id: purchase.store_id,
          store_name: purchase.store?.name || 'Unknown',
          total_purchased: 0,
          total_purchase_cost: 0,
          total_sold: 0,
          total_revenue: 0,
          current_stock: 0,
          current_stock_value: 0,
          total_loss_value: 0,
          net_profit: 0,
          net_profit_margin_percent: 0
        });
      }
      const record = profitMap.get(key);
      record.total_purchased += purchase.quantity || 0;
      record.total_purchase_cost += purchase.total_cost || 0;
    });

    inventoryData?.forEach((inv: any) => {
      const key = `${inv.product_id}_${inv.store_id}`;
      if (profitMap.has(key)) {
        const record = profitMap.get(key);
        record.current_stock = inv.total_quantity || 0;
        record.current_stock_value = (inv.total_quantity || 0) * (record.total_purchase_cost / Math.max(record.total_purchased, 1));
      }
    });

    ordersData?.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const productId = item.variant_id;
        const storeId = order.store_id;
        const key = `${productId}_${storeId}`;

        if (profitMap.has(key)) {
          const record = profitMap.get(key);
          record.total_sold += item.quantity || 0;
          record.total_revenue += (item.price * item.quantity) || 0;
        }
      });
    });

    profitMap.forEach((record) => {
      record.net_profit = record.total_revenue - record.total_purchase_cost;
      record.net_profit_margin_percent = record.total_revenue > 0
        ? (record.net_profit / record.total_revenue) * 100
        : 0;
    });

    let results = Array.from(profitMap.values());

    if (storeId && storeId !== 'all') {
      results = results.filter(r => r.store_id === storeId);
    }

    return { data: results, error: null };
  } catch (error: any) {
    console.error('Profit analysis error:', error);
    return { data: [], error };
  }
}

export async function getProductProfitDetails(productId: string, storeId?: string) {
  let query = supabase
    .from('purchase_records')
    .select('*')
    .eq('product_id', productId);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query.order('purchase_date', { ascending: false });

  return { data, error };
}
