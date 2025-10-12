export type UserRole = 'customer' | 'delivery_agent' | 'admin' | 'super_admin';
export type OrderStatus = 'pending' | 'order_accepted' | 'packed' | 'assigned_delivery_partner' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refund_initiated' | 'refund_completed' | 'partial_refund';
export type PaymentMethod = 'COD' | 'Online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile_number: string | null;
  role: UserRole;
  store_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  contact_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'vegetable' | 'grocery';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  unit_label: string;
  price: number;
  discount_price: number | null;
  sku: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface StoreInventory {
  id: string;
  store_id: string;
  variant_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
  store?: Store;
  variant?: ProductVariant;
}

export interface Order {
  id: string;
  customer_id: string;
  store_id: string | null;
  delivery_agent_id: string | null;
  delivery_address_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  discount_code: string | null;
  discount_amount: number;
  delivery_charges: number;
  order_total: number;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
  customer?: User;
  store?: Store;
  delivery_agent?: User;
  order_items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  variant?: ProductVariant;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  transaction_id: string | null;
  amount: number;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null;
  min_order_value: number;
  max_discount: number | null;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PromotionalBanner {
  id: string;
  title: string | null;
  image_url: string;
  link_type: 'product' | 'category' | 'external';
  link_target: string | null;
  external_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentLocation {
  agent_id: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  agent?: User;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string | null;
  message: string | null;
  type: 'order' | 'promo' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface OrderActivityLog {
  id: string;
  order_id: string | null;
  status: OrderStatus | null;
  changed_by: string | null;
  note: string | null;
  changed_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: number;
  type: 'full' | 'partial' | null;
  reason: string | null;
  status: 'initiated' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}