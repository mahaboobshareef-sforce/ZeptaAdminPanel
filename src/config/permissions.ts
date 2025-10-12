import type { UserRole } from '../types/database';

export type Permission =
  | 'view_dashboard'
  | 'manage_orders'
  | 'manage_products'
  | 'manage_inventory'
  | 'bulk_inventory'
  | 'purchase_management'
  | 'inventory_adjustments'
  | 'manage_delivery_agents'
  | 'manage_stores'
  | 'manage_categories'
  | 'manage_coupons'
  | 'manage_banners'
  | 'view_payments'
  | 'manage_refunds'
  | 'view_ratings'
  | 'manage_support'
  | 'view_notifications'
  | 'view_analytics'
  | 'view_profit_analysis'
  | 'manage_settings'
  | 'manage_users';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_orders',
    'manage_products',
    'manage_inventory',
    'bulk_inventory',
    'purchase_management',
    'inventory_adjustments',
    'manage_delivery_agents',
    'manage_stores',
    'manage_categories',
    'manage_coupons',
    'manage_banners',
    'view_payments',
    'manage_refunds',
    'view_ratings',
    'manage_support',
    'view_notifications',
    'view_analytics',
    'view_profit_analysis',
    'manage_settings',
    'manage_users',
  ],

  admin: [
    'view_dashboard',
    'manage_orders',
    'manage_products',
    'manage_inventory',
    'bulk_inventory',
    'manage_delivery_agents',
    'manage_stores',
    'manage_categories',
    'manage_coupons',
    'manage_banners',
    'view_ratings',
    'manage_support',
    'view_notifications',
    'view_analytics',
    'manage_settings',
  ],

  delivery_agent: [],
  customer: [],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}
