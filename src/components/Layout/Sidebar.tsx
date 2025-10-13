import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  Truck,
  BarChart3,
  Settings,
  Tag,
  Image,
  MapPin,
  Receipt,
  RefreshCw,
  Star,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../config/permissions';

const navigation: Array<{
  name: string;
  href: string;
  icon: any;
  permission: Permission;
}> = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'view_dashboard' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'manage_orders' },
  { name: 'Products', href: '/products', icon: Package, permission: 'manage_products' },
  { name: 'Inventory', href: '/inventory', icon: Store, permission: 'manage_inventory' },
  { name: 'Bulk Inventory', href: '/bulk-inventory', icon: Package, permission: 'bulk_inventory' },
  { name: 'Purchase Management', href: '/purchase-management', icon: ShoppingBag, permission: 'purchase_management' },
  { name: 'Inventory Adjustments', href: '/inventory-adjustments', icon: AlertTriangle, permission: 'inventory_adjustments' },
  { name: 'Delivery Agents', href: '/delivery-agents', icon: Truck, permission: 'manage_delivery_agents' },
  { name: 'Stores', href: '/stores', icon: MapPin, permission: 'manage_stores' },
  { name: 'Categories', href: '/categories', icon: Tag, permission: 'manage_categories' },
  { name: 'Coupons', href: '/coupons', icon: Receipt, permission: 'manage_coupons' },
  { name: 'Banners', href: '/banners', icon: Image, permission: 'manage_banners' },
  { name: 'Payments', href: '/payments', icon: Receipt, permission: 'view_payments' },
  { name: 'Refunds', href: '/refunds', icon: RefreshCw, permission: 'manage_refunds' },
  { name: 'Ratings', href: '/ratings', icon: Star, permission: 'view_ratings' },
  { name: 'Support Tickets', href: '/support-tickets', icon: MessageSquare, permission: 'manage_support' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'view_analytics' },
  { name: 'Profit Analysis', href: '/profit-analysis', icon: TrendingUp, permission: 'view_profit_analysis' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'manage_settings' },
];

export default function Sidebar() {
  const { can } = usePermissions();

  const visibleNavigation = navigation.filter(item => can(item.permission));

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h1 className="text-xl font-bold text-white">Zepta Admin</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon
              className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                location.pathname === item.href ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-500'
              }`}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}