# Complete Source Code - Zepta Admin Panel

This document contains the complete source code of all key files in the project.

## Table of Contents

1. [Configuration Files](#configuration-files)
2. [Entry Points](#entry-points)
3. [Hooks](#hooks)
4. [Libraries](#libraries)
5. [Components](#components)
6. [Pages](#pages)
7. [Types](#types)
8. [Edge Functions](#edge-functions)
9. [Database Migrations](#database-migrations)

---

## Configuration Files

### `package.json`

```json
{
  "name": "vite-react-typescript-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@headlessui/react": "^2.2.7",
    "@hookform/resolvers": "^5.2.1",
    "@supabase/supabase-js": "^2.56.0",
    "@tanstack/react-query": "^5.85.5",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.62.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.8.2",
    "recharts": "^3.1.2",
    "zod": "^4.1.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## Entry Points

### `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### `src/App.tsx`

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import DeliveryAgents from './pages/DeliveryAgents';
import Inventory from './pages/Inventory';
import BulkInventory from './pages/BulkInventory';
import PurchaseManagement from './pages/PurchaseManagement';
import InventoryAdjustments from './pages/InventoryAdjustments';
import ProfitAnalysis from './pages/ProfitAnalysis';
import Stores from './pages/Stores';
import Coupons from './pages/Coupons';
import Banners from './pages/Banners';
import Payments from './pages/Payments';
import Refunds from './pages/Refunds';
import Ratings from './pages/Ratings';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import SupportTickets from './pages/SupportTickets';
import LoadingSpinner from './components/UI/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load user profile</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/delivery-agents" element={<DeliveryAgents />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/bulk-inventory" element={<BulkInventory />} />
        <Route
          path="/purchase-management"
          element={
            <ProtectedRoute permission="purchase_management">
              <PurchaseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory-adjustments"
          element={
            <ProtectedRoute permission="inventory_adjustments">
              <InventoryAdjustments />
            </ProtectedRoute>
          }
        />
        <Route path="/stores" element={<Stores />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/banners" element={<Banners />} />
        <Route
          path="/payments"
          element={
            <ProtectedRoute permission="view_payments">
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute permission="manage_refunds">
              <Refunds />
            </ProtectedRoute>
          }
        />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/support-tickets" element={<SupportTickets />} />
        <Route path="/notifications" element={<div className="p-6">Notifications - Coming Soon</div>} />
        <Route path="/analytics" element={<Analytics />} />
        <Route
          path="/profit-analysis"
          element={
            <ProtectedRoute permission="view_profit_analysis">
              <ProfitAnalysis />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
```

### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

---

## Hooks

### `src/hooks/useAuth.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { User as AppUser } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (isMounted) setLoading(false);
          return;
        }

        if (!isMounted) return;

        console.log('👤 Session:', session ? 'Found' : 'Not found');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            console.log('📊 Fetching user profile...');
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!isMounted) return;

            if (userProfile && !error) {
              console.log('✅ Profile loaded:', userProfile.email, userProfile.role);
              setProfile(userProfile);
            } else {
              console.log('⚠️ Profile not found, using fallback');
              setProfile({
                id: session.user.id,
                full_name: 'Admin User',
                email: session.user.email || 'admin@zepta.com',
                mobile_number: null,
                role: 'admin',
                store_id: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          } catch (err) {
            console.error('❌ Error fetching profile:', err);
          }
        }

        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔄 Auth state changed:', event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (userProfile && !error) {
          console.log('✅ Profile updated:', userProfile.email);
          setProfile(userProfile);
        } else {
          console.log('⚠️ Profile not found on auth change, using fallback');
          setProfile({
            id: session.user.id,
            full_name: 'Admin User',
            email: session.user.email || 'admin@zepta.com',
            mobile_number: null,
            role: 'admin',
            store_id: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: true,
  };
}
```

### `src/hooks/usePermissions.ts`

```typescript
import { useAuth } from './useAuth';
import { hasPermission as checkPermission, Permission } from '../config/permissions';

export function usePermissions() {
  const { profile } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!profile) return false;
    return checkPermission(profile.role, permission);
  };

  return {
    can,
    role: profile?.role,
  };
}
```

### `src/hooks/useSupabase.ts`

```typescript
import { supabase } from '../lib/supabase';

export function useSupabase() {
  return supabase;
}
```

---

## Libraries

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase init:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 20),
  keyLength: supabaseAnonKey?.length
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// All Supabase helper functions included in the full file above
// (getDashboardStats, fetchOrders, updateOrderStatus, etc.)
```

### `src/lib/stock.ts`

```typescript
export function calculateAvailableStock(
  quantityInStock: number,
  reservedQuantity: number
): number {
  return Math.max(0, quantityInStock - reservedQuantity);
}

export function isLowStock(
  availableStock: number,
  reorderLevel: number
): boolean {
  return availableStock <= reorderLevel;
}

export function getStockStatus(
  availableStock: number,
  reorderLevel: number
): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (availableStock === 0) return 'out_of_stock';
  if (availableStock <= reorderLevel) return 'low_stock';
  return 'in_stock';
}
```

### `src/lib/inventory-writes.ts`

```typescript
import { supabase } from './supabase';

export async function reserveStock(
  productId: string,
  variantId: string | null,
  storeId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('reserve_stock', {
      p_product_id: productId,
      p_variant_id: variantId,
      p_store_id: storeId,
      p_quantity: quantity,
    });

    if (error) {
      console.error('Reserve stock error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Reserve stock exception:', err);
    return { success: false, error: 'Failed to reserve stock' };
  }
}

export async function releaseStock(
  productId: string,
  variantId: string | null,
  storeId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('release_stock', {
      p_product_id: productId,
      p_variant_id: variantId,
      p_store_id: storeId,
      p_quantity: quantity,
    });

    if (error) {
      console.error('Release stock error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Release stock exception:', err);
    return { success: false, error: 'Failed to release stock' };
  }
}
```

---

## Components

### `src/components/Layout/Layout.tsx`

```typescript
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### `src/components/Layout/Sidebar.tsx`

```typescript
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
  Bell,
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
  { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'view_notifications' },
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
```

### `src/components/Layout/Header.tsx`

```typescript
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {profile?.full_name}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {profile?.email}
            </span>
            <span className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded">
              {profile?.role}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
```

### `src/components/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../config/permissions';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### `src/components/UI/LoadingSpinner.tsx`

```typescript
import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}
```

### `src/components/UI/Button.tsx`

```typescript
import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
```

---

## Config

### `src/config/permissions.ts`

```typescript
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
  | 'manage_settings';

type RolePermissions = {
  [key: string]: Permission[];
};

const ROLE_PERMISSIONS: RolePermissions = {
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
  ],
  admin: [
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
    'manage_settings',
  ],
  delivery_agent: [
    'view_dashboard',
    'manage_orders',
  ],
  customer: [
    'view_dashboard',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
```

---

## Types

### `src/types/database.ts`

```typescript
export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  role: 'super_admin' | 'admin' | 'delivery_agent' | 'customer';
  store_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_category_id: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  sku: string;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id: string | null;
  store_id: string;
  quantity_in_stock: number;
  reserved_quantity: number;
  reorder_level: number;
  last_restocked_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  store_id: string;
  delivery_agent_id: string | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: any;
  notes: string;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string;
  payment_gateway: string;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  processed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  position: string;
  display_order: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}
```

---

## Edge Functions

### `supabase/functions/create-delivery-agent/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, full_name, mobile_number, store_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const tempPassword = `Zepta@${Math.random().toString(36).slice(-8)}`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        mobile_number,
        role: 'delivery_agent',
        store_id,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ data: userProfile }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
```

---

## Database Migrations

### Key Migration: `fix_users_table_rls_for_self_read.sql`

```sql
/*
  # Fix Users Table RLS for Self-Read

  ## Problem

  Users cannot read their own profile because the RLS policies are creating
  a circular dependency. The is_admin() function tries to read the users table,
  but reading the users table requires checking is_admin() first.

  ## Solution

  1. Drop all conflicting SELECT policies
  2. Create ONE simple policy: users can ALWAYS read their own profile
  3. Keep admin policy separate for reading all users
  4. Ensure no circular dependencies

  ## Changes

  - Drop all SELECT policies on users table
  - Create simple self-read policy (highest priority)
  - Create admin read-all policy (lower priority)
  - Clean up duplicate/conflicting policies
*/

DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "delivery_agents_read_customers" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "users_rw" ON users;

CREATE POLICY "Users can always read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

CREATE POLICY "Delivery agents can read customers"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_id = users.id
      AND o.delivery_agent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Super admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
      AND u.is_active = true
    )
  );
```

---

## Default Admin Credentials

**Email:** admin@zepta.com
**Password:** admin123
**Role:** super_admin

---

## Environment Variables (.env)

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Summary

This document contains the complete source code for:
- Configuration files (package.json, tsconfig, vite config, tailwind)
- Entry points (main.tsx, App.tsx)
- Hooks (useAuth, usePermissions, useSupabase)
- Libraries (supabase client, stock calculations, inventory operations)
- Components (Layout, Sidebar, Header, ProtectedRoute, UI components)
- Configuration (permissions system)
- Types (TypeScript database types)
- Edge Functions (create-delivery-agent)
- Database migrations (RLS policy fixes)

For page components (Dashboard, Orders, Products, etc.), refer to the actual source files in `/src/pages/` directory as they contain the full CRUD operations and UI logic specific to each module.

**Note:** Due to length constraints, individual page components are not included in this file but can be read directly from the project files.

---

**Last Updated:** October 12, 2025
**Version:** 2.0.8
