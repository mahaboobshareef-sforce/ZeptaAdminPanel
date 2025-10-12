# Zepta Admin Panel - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
7. [Core Features](#core-features)
8. [File-by-File Code Explanation](#file-by-file-code-explanation)
9. [Database Migrations](#database-migrations)
10. [Edge Functions](#edge-functions)
11. [How to Use](#how-to-use)

---

## Project Overview

**Zepta Admin Panel** is a comprehensive e-commerce management system built for multi-store operations. It provides a complete backend administration interface for managing products, orders, inventory, users, delivery agents, payments, refunds, support tickets, and analytics.

### Key Capabilities

- Multi-store management
- Product catalog with variants
- Real-time inventory tracking
- Order management with delivery tracking
- User and role management (RBAC)
- Payment and refund processing
- Customer support ticket system
- Analytics and profit analysis
- Promotional tools (coupons, banners)
- Purchase management
- Delivery agent coordination

---

## Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM 7.8.2** - Routing
- **TailwindCSS 3.4.1** - Styling
- **React Query 5.85.5** - Data fetching and caching
- **React Hook Form 7.62.0** - Form management
- **Zod 4.1.3** - Schema validation
- **Lucide React** - Icons
- **Recharts 3.1.2** - Charts and analytics
- **React Hot Toast** - Notifications

### Backend
- **Supabase** - Database, authentication, and backend services
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Database-level authorization
- **Edge Functions** - Serverless functions (Deno runtime)

---

## Project Structure

```
/project
├── src/
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Root component with routing
│   ├── index.css                   # Global styles
│   │
│   ├── components/                 # Reusable components
│   │   ├── AuthProvider.tsx        # Authentication context (deprecated)
│   │   ├── ProtectedRoute.tsx      # Route protection component
│   │   ├── Layout/                 # Layout components
│   │   │   ├── Layout.tsx          # Main layout wrapper
│   │   │   ├── Header.tsx          # Top navigation bar
│   │   │   └── Sidebar.tsx         # Left sidebar navigation
│   │   └── UI/                     # UI components
│   │       ├── Badge.tsx           # Status badges
│   │       ├── Button.tsx          # Button component
│   │       ├── Card.tsx            # Card container
│   │       ├── Input.tsx           # Input field
│   │       ├── LoadingSpinner.tsx  # Loading indicator
│   │       ├── Modal.tsx           # Modal dialog
│   │       ├── Select.tsx          # Dropdown select
│   │       ├── StatCard.tsx        # Statistics card
│   │       └── Table.tsx           # Data table
│   │
│   ├── pages/                      # Page components
│   │   ├── Login.tsx               # Login page
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── Orders.tsx              # Order management
│   │   ├── Products.tsx            # Product management
│   │   ├── Categories.tsx          # Category management
│   │   ├── DeliveryAgents.tsx      # Delivery agent management
│   │   ├── Inventory.tsx           # Inventory tracking
│   │   ├── BulkInventory.tsx       # Bulk inventory operations
│   │   ├── PurchaseManagement.tsx  # Purchase orders
│   │   ├── InventoryAdjustments.tsx # Inventory adjustments
│   │   ├── ProfitAnalysis.tsx      # Profit analysis
│   │   ├── Stores.tsx              # Store management
│   │   ├── Coupons.tsx             # Coupon management
│   │   ├── Banners.tsx             # Promotional banners
│   │   ├── Payments.tsx            # Payment tracking
│   │   ├── Refunds.tsx             # Refund management
│   │   ├── Ratings.tsx             # Product ratings
│   │   ├── Analytics.tsx           # Analytics dashboard
│   │   ├── Settings.tsx            # System settings
│   │   ├── SupportTickets.tsx      # Support ticket system
│   │   └── Users.tsx               # User management
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── usePermissions.ts       # Permission checking hook
│   │   └── useSupabase.ts          # Supabase client hook
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── supabase.ts             # Supabase client configuration
│   │   ├── stock.ts                # Stock calculation utilities
│   │   ├── inventory-writes.ts     # Inventory write operations
│   │   └── insertDummyData.ts      # Test data insertion
│   │
│   ├── config/                     # Configuration files
│   │   └── permissions.ts          # RBAC permission definitions
│   │
│   └── types/                      # TypeScript type definitions
│       └── database.ts             # Database type definitions
│
├── supabase/
│   ├── migrations/                 # Database migration files
│   │   └── *.sql                   # SQL migration scripts
│   └── functions/                  # Edge functions
│       └── create-delivery-agent/  # Delivery agent creation function
│           └── index.ts
│
├── public/                         # Static assets
├── .env                            # Environment variables
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project readme
```

---

## Database Schema

### Core Tables

#### 1. **users**
Stores all user accounts (admins, delivery agents, customers).

```sql
- id: uuid (Primary Key, references auth.users)
- full_name: text
- email: text (unique)
- mobile_number: text
- role: text (admin, super_admin, delivery_agent, customer)
- store_id: uuid (foreign key to stores, nullable)
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

**Key Features:**
- Linked to Supabase Auth
- Role-based access control
- Optional store assignment for store managers
- Active/inactive status

#### 2. **stores**
Physical or virtual store locations.

```sql
- id: uuid (Primary Key)
- name: text
- address: text
- city: text
- state: text
- pincode: text
- phone: text
- email: text
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 3. **categories**
Product categories for organization.

```sql
- id: uuid (Primary Key)
- name: text
- description: text
- parent_category_id: uuid (self-referencing for hierarchy)
- image_url: text
- is_active: boolean
- display_order: integer
- created_at: timestamptz
- updated_at: timestamptz
```

**Key Features:**
- Hierarchical structure (parent-child relationships)
- Display order for sorting
- Image support

#### 4. **products**
Product catalog with variants support.

```sql
- id: uuid (Primary Key)
- name: text
- description: text
- category_id: uuid (foreign key to categories)
- base_price: numeric
- sku: text (unique)
- image_urls: text[]
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 5. **product_variants**
Product variations (size, color, etc.).

```sql
- id: uuid (Primary Key)
- product_id: uuid (foreign key to products)
- name: text (e.g., "Large", "Red")
- sku: text (unique)
- price: numeric
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 6. **inventory**
Real-time stock tracking per store.

```sql
- id: uuid (Primary Key)
- product_id: uuid (foreign key to products)
- variant_id: uuid (foreign key to product_variants, nullable)
- store_id: uuid (foreign key to stores)
- quantity_in_stock: integer
- reserved_quantity: integer
- reorder_level: integer
- last_restocked_at: timestamptz
- updated_at: timestamptz
```

**Key Calculation:**
- **Available Stock** = quantity_in_stock - reserved_quantity

#### 7. **inventory_adjustments**
Track all inventory changes.

```sql
- id: uuid (Primary Key)
- product_id: uuid
- variant_id: uuid (nullable)
- store_id: uuid
- adjustment_type: text (restock, damage, return, manual)
- quantity_change: integer (positive or negative)
- reason: text
- notes: text
- adjusted_by: uuid (foreign key to users)
- status: text (pending, approved, rejected)
- approved_by: uuid (nullable)
- approved_at: timestamptz (nullable)
- created_at: timestamptz
```

#### 8. **orders**
Customer orders.

```sql
- id: uuid (Primary Key)
- order_number: text (unique)
- customer_id: uuid (foreign key to users)
- store_id: uuid (foreign key to stores)
- delivery_agent_id: uuid (foreign key to users, nullable)
- status: text (pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
- payment_status: text (pending, paid, failed, refunded)
- payment_method: text
- subtotal: numeric
- tax: numeric
- delivery_fee: numeric
- discount: numeric
- total: numeric
- delivery_address: jsonb
- notes: text
- created_at: timestamptz
- updated_at: timestamptz
- delivered_at: timestamptz (nullable)
```

#### 9. **order_items**
Items within each order.

```sql
- id: uuid (Primary Key)
- order_id: uuid (foreign key to orders)
- product_id: uuid (foreign key to products)
- variant_id: uuid (foreign key to product_variants, nullable)
- quantity: integer
- unit_price: numeric
- subtotal: numeric
- created_at: timestamptz
```

#### 10. **payments**
Payment transaction records.

```sql
- id: uuid (Primary Key)
- order_id: uuid (foreign key to orders)
- amount: numeric
- payment_method: text
- payment_status: text (pending, completed, failed, refunded)
- transaction_id: text
- payment_gateway: text
- created_at: timestamptz
- updated_at: timestamptz
```

#### 11. **refunds**
Refund requests and processing.

```sql
- id: uuid (Primary Key)
- order_id: uuid (foreign key to orders)
- payment_id: uuid (foreign key to payments)
- amount: numeric
- reason: text
- status: text (pending, approved, rejected, completed)
- processed_by: uuid (foreign key to users, nullable)
- created_at: timestamptz
- updated_at: timestamptz
```

#### 12. **coupons**
Discount coupon management.

```sql
- id: uuid (Primary Key)
- code: text (unique)
- description: text
- discount_type: text (percentage, fixed)
- discount_value: numeric
- min_order_amount: numeric
- max_discount: numeric
- usage_limit: integer
- used_count: integer
- valid_from: timestamptz
- valid_until: timestamptz
- is_active: boolean
- created_at: timestamptz
```

#### 13. **promotional_banners**
Marketing banners.

```sql
- id: uuid (Primary Key)
- title: text
- description: text
- image_url: text
- link_url: text
- position: text (home, category, product)
- display_order: integer
- is_active: boolean
- valid_from: timestamptz
- valid_until: timestamptz
- created_at: timestamptz
```

#### 14. **ratings_reviews**
Product reviews and ratings.

```sql
- id: uuid (Primary Key)
- product_id: uuid (foreign key to products)
- user_id: uuid (foreign key to users)
- order_id: uuid (foreign key to orders)
- rating: integer (1-5)
- review_text: text
- is_verified_purchase: boolean
- is_approved: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 15. **support_tickets**
Customer support system.

```sql
- id: uuid (Primary Key)
- ticket_number: text (unique, auto-generated)
- user_id: uuid (foreign key to users)
- order_id: uuid (foreign key to orders, nullable)
- subject: text
- description: text
- status: text (open, in_progress, resolved, closed)
- priority: text (low, medium, high, urgent)
- category: text (order_issue, product_inquiry, payment_issue, delivery_issue, other)
- assigned_to: uuid (foreign key to users, nullable)
- created_at: timestamptz
- updated_at: timestamptz
- resolved_at: timestamptz (nullable)
```

#### 16. **support_messages**
Ticket conversation threads.

```sql
- id: uuid (Primary Key)
- ticket_id: uuid (foreign key to support_tickets)
- user_id: uuid (foreign key to users)
- message: text
- attachment_urls: text[] (nullable)
- created_at: timestamptz
```

#### 17. **purchase_orders**
Supplier purchase orders.

```sql
- id: uuid (Primary Key)
- po_number: text (unique)
- supplier_name: text
- supplier_contact: text
- store_id: uuid (foreign key to stores)
- status: text (draft, submitted, approved, received, cancelled)
- total_amount: numeric
- notes: text
- ordered_by: uuid (foreign key to users)
- approved_by: uuid (nullable)
- created_at: timestamptz
- updated_at: timestamptz
- expected_delivery_date: date (nullable)
```

#### 18. **purchase_order_items**
Items in purchase orders.

```sql
- id: uuid (Primary Key)
- purchase_order_id: uuid (foreign key to purchase_orders)
- product_id: uuid (foreign key to products)
- variant_id: uuid (foreign key to product_variants, nullable)
- quantity: integer
- unit_cost: numeric
- subtotal: numeric
- created_at: timestamptz
```

#### 19. **notifications**
System notifications.

```sql
- id: uuid (Primary Key)
- user_id: uuid (foreign key to users)
- title: text
- message: text
- type: text (order, inventory, system, support)
- reference_id: uuid (nullable)
- is_read: boolean
- created_at: timestamptz
```

---

## Authentication System

### Overview

The app uses **Supabase Auth** for authentication, which provides:
- Email/password authentication
- JWT-based session management
- Secure password hashing
- Session persistence

### Authentication Flow

1. **User logs in** via `/login` page
2. Supabase validates credentials
3. On success, Supabase returns a JWT token and session
4. Session is stored in browser (localStorage)
5. Every request includes the JWT in the Authorization header
6. Server validates JWT and extracts user ID

### Key Files

#### `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Purpose:** Creates and exports the Supabase client singleton.

#### `src/hooks/useAuth.ts`
Custom hook that manages authentication state.

**Key Functions:**
- `useAuth()` - Returns current user, profile, loading state
- `signIn(email, password)` - Logs user in
- `signOut()` - Logs user out

**Features:**
- Listens for auth state changes
- Fetches user profile from database
- Provides 10-second timeout protection
- Comprehensive error handling
- Console logging for debugging

**Important Implementation Details:**

```typescript
// Timeout protection prevents infinite loading
const timeoutId = setTimeout(() => {
  if (isMounted && loading) {
    console.warn('Auth loading timeout - forcing completion');
    setLoading(false);
  }
}, 10000);

// Fetch session
const { data: { session } } = await supabase.auth.getSession();

// Fetch user profile
const { data: userProfile } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle();
```

**Critical Fix:** The hook uses `auth.uid()` instead of database queries to avoid circular dependencies with RLS policies.

#### `src/pages/Login.tsx`
Login page component with email/password form.

**Key Features:**
- React Hook Form for validation
- Zod schema validation
- Error handling and display
- Loading states
- Toast notifications

---

## Role-Based Access Control (RBAC)

### Roles

1. **super_admin** - Full system access, can create/delete admins
2. **admin** - Store management, most operations
3. **delivery_agent** - View assigned orders, update delivery status
4. **customer** - Place orders, track orders, raise support tickets

### Permission System

Defined in `src/config/permissions.ts`:

```typescript
export const ROLE_PERMISSIONS = {
  super_admin: {
    users: ['view', 'create', 'edit', 'delete'],
    stores: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    payments: ['view', 'create', 'edit', 'delete'],
    refunds: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'export'],
    settings: ['view', 'edit'],
  },
  admin: {
    // Similar but limited permissions
  },
  delivery_agent: {
    orders: ['view', 'edit_status'],
  },
  customer: {
    orders: ['view', 'create'],
    support_tickets: ['view', 'create', 'edit'],
  }
};
```

### Permission Checking

#### `src/hooks/usePermissions.ts`
```typescript
export function usePermissions() {
  const { profile } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;

    const role = profile.role;
    const permissions = ROLE_PERMISSIONS[role] || {};

    // Check if permission exists in role
    return checkPermission(permissions, permission);
  };

  return { hasPermission };
}
```

#### `src/components/ProtectedRoute.tsx`
Wraps routes that require specific permissions.

```typescript
function ProtectedRoute({ permission, children }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <Navigate to="/" />;
  }

  return children;
}
```

**Usage:**
```typescript
<Route
  path="/refunds"
  element={
    <ProtectedRoute permission="manage_refunds">
      <Refunds />
    </ProtectedRoute>
  }
/>
```

### Database-Level Security (RLS)

All tables have Row Level Security (RLS) policies that enforce permissions at the database level.

**Key Principle:** Users can ONLY access data they're authorized for.

**Example Policy (users table):**
```sql
-- Users can read their own profile
CREATE POLICY "Users can always read own profile"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );
```

**Critical Fix:** Policies use `auth.uid()` (from JWT) instead of querying the database to avoid circular dependencies.

---

## Core Features

### 1. Dashboard
**File:** `src/pages/Dashboard.tsx`

**Features:**
- Key metrics (revenue, orders, customers, products)
- Recent orders table
- Sales charts
- Quick stats

**Data Sources:**
- Orders table (revenue, order count)
- Users table (customer count)
- Products table (product count)
- Order items (top products)

### 2. Order Management
**File:** `src/pages/Orders.tsx`

**Features:**
- View all orders
- Filter by status, date, store
- Update order status
- Assign delivery agents
- View order details
- Print invoices

**Workflow:**
1. Customer places order → status: "pending"
2. Admin confirms → status: "confirmed"
3. Store prepares → status: "preparing"
4. Agent picks up → status: "out_for_delivery"
5. Delivered → status: "delivered"

### 3. Product Management
**File:** `src/pages/Products.tsx`

**Features:**
- CRUD operations for products
- Product variants (size, color)
- Image uploads (multiple images)
- Category assignment
- Price management
- SKU tracking
- Active/inactive status

**Key Operations:**
- Add new product with variants
- Edit product details
- Delete products
- Toggle active status

### 4. Inventory Management
**File:** `src/pages/Inventory.tsx`

**Features:**
- Real-time stock levels per store
- Reserved quantity tracking
- Low stock alerts
- Reorder level management
- Stock history

**Stock Calculation:**
```typescript
Available Stock = quantity_in_stock - reserved_quantity
```

**File:** `src/pages/BulkInventory.tsx`
- Bulk stock updates
- CSV import/export
- Multi-store operations

### 5. Inventory Adjustments
**File:** `src/pages/InventoryAdjustments.tsx`

**Features:**
- Create adjustment requests
- Approval workflow
- Adjustment types:
  - Restock (purchase received)
  - Damage (broken items)
  - Return (customer returns)
  - Manual (corrections)

**Workflow:**
1. User creates adjustment → status: "pending"
2. Admin reviews and approves → status: "approved"
3. System applies changes to inventory
4. If rejected → status: "rejected", no changes

**Database Function:**
```sql
apply_inventory_adjustment(adjustment_id uuid)
```
Applies the adjustment to inventory table atomically.

### 6. Purchase Management
**File:** `src/pages/PurchaseManagement.tsx`

**Features:**
- Create purchase orders to suppliers
- Track PO status (draft, submitted, approved, received)
- Multi-item POs
- Receive stock into inventory
- Cost tracking

**Workflow:**
1. Create PO → status: "draft"
2. Submit → status: "submitted"
3. Admin approves → status: "approved"
4. Receive goods → status: "received", stock updated

### 7. User Management
**File:** `src/pages/Users.tsx`

**Features:**
- View all users
- Create new users (admins, agents)
- Edit user roles
- Assign stores
- Deactivate users
- Search and filter

**Roles:**
- super_admin: Full access
- admin: Store operations
- delivery_agent: Delivery only
- customer: Browse and order

### 8. Delivery Agent Management
**File:** `src/pages/DeliveryAgents.tsx`

**Features:**
- View all delivery agents
- Create new agents (via Edge Function)
- Assign to orders
- Track deliveries
- Performance metrics

**Edge Function:** `create-delivery-agent`
Creates a new agent account with auth credentials.

### 9. Payment Management
**File:** `src/pages/Payments.tsx`

**Features:**
- View all payments
- Payment status tracking
- Payment method breakdown
- Transaction IDs
- Gateway integration tracking

**Statuses:**
- pending: Awaiting payment
- completed: Payment received
- failed: Payment failed
- refunded: Money returned

### 10. Refund Management
**File:** `src/pages/Refunds.tsx`

**Features:**
- Process refund requests
- Approve/reject refunds
- Track refund status
- Reason tracking
- Amount verification

**Workflow:**
1. Customer requests refund
2. Admin reviews
3. Approve → Process refund via payment gateway
4. Update payment status to "refunded"

### 11. Support Ticket System
**File:** `src/pages/SupportTickets.tsx`

**Features:**
- Create support tickets
- Assign tickets to agents
- Priority levels (low, medium, high, urgent)
- Categories (order, product, payment, delivery, other)
- Status tracking (open, in_progress, resolved, closed)
- Message threads
- Attachment support

**Workflow:**
1. Customer raises ticket → status: "open"
2. Admin assigns to agent → status: "in_progress"
3. Agent resolves → status: "resolved"
4. Customer confirms → status: "closed"

### 12. Analytics & Reporting
**File:** `src/pages/Analytics.tsx`

**Features:**
- Revenue trends (daily, weekly, monthly)
- Order statistics
- Top products
- Customer insights
- Store performance
- Category breakdown

**File:** `src/pages/ProfitAnalysis.tsx`
- Cost vs revenue analysis
- Profit margins
- Product profitability
- Store profitability

### 13. Promotional Tools

#### Coupons
**File:** `src/pages/Coupons.tsx`

**Features:**
- Create discount codes
- Percentage or fixed discount
- Min order amount
- Max discount cap
- Usage limits
- Validity periods

#### Banners
**File:** `src/pages/Banners.tsx`

**Features:**
- Create promotional banners
- Image uploads
- Link URLs
- Position (home, category, product)
- Display order
- Schedule (valid from/until)

### 14. Ratings & Reviews
**File:** `src/pages/Ratings.tsx`

**Features:**
- View all product reviews
- Approve/reject reviews
- Verified purchase badge
- Rating statistics
- Moderate content

---

## File-by-File Code Explanation

### Entry Points

#### `src/main.tsx`
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

**Purpose:** Application entry point. Mounts the React app to the DOM.

#### `src/App.tsx`
**Purpose:** Root component with routing and global providers.

**Key Features:**
- React Query client setup (caching, refetch config)
- React Router setup (BrowserRouter)
- Authentication check on load
- Protected routing
- Global toast notifications

**Structure:**
```typescript
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

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Login />;
  if (!profile) return <ErrorScreen />;

  return (
    <Layout>
      <Routes>
        {/* All routes */}
      </Routes>
    </Layout>
  );
}
```

### Components

#### `src/components/Layout/Layout.tsx`
**Purpose:** Main layout wrapper with sidebar and header.

**Structure:**
```typescript
function Layout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### `src/components/Layout/Sidebar.tsx`
**Purpose:** Left navigation sidebar.

**Features:**
- Navigation links based on role
- Active route highlighting
- Icons from Lucide React
- Collapsible sections
- Permission-based menu items

**Key Navigation Items:**
- Dashboard
- Orders
- Products
- Categories
- Inventory
- Users
- Stores
- Payments
- Analytics
- Settings

#### `src/components/Layout/Header.tsx`
**Purpose:** Top navigation bar.

**Features:**
- User profile dropdown
- Notifications bell
- Store selector (for multi-store)
- Logout button
- User role badge

#### `src/components/ProtectedRoute.tsx`
**Purpose:** Route protection based on permissions.

```typescript
function ProtectedRoute({ permission, children }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    toast.error('Access denied');
    return <Navigate to="/" replace />;
  }

  return children;
}
```

**Usage:**
```typescript
<Route
  path="/refunds"
  element={
    <ProtectedRoute permission="manage_refunds">
      <Refunds />
    </ProtectedRoute>
  }
/>
```

### UI Components

#### `src/components/UI/Button.tsx`
Reusable button component with variants.

**Props:**
- variant: 'primary' | 'secondary' | 'danger' | 'ghost'
- size: 'sm' | 'md' | 'lg'
- loading: boolean
- disabled: boolean

#### `src/components/UI/Modal.tsx`
Modal dialog component.

**Features:**
- Backdrop click to close
- Escape key to close
- Customizable header/footer
- Transition animations

#### `src/components/UI/Table.tsx`
Data table component.

**Features:**
- Sortable columns
- Row selection
- Pagination
- Loading states
- Empty states

#### `src/components/UI/Input.tsx`
Form input field.

**Features:**
- Label support
- Error message display
- Icons (prefix/suffix)
- Validation states

#### `src/components/UI/Select.tsx`
Dropdown select component.

**Features:**
- Search/filter options
- Multi-select support
- Custom option rendering
- Loading states

#### `src/components/UI/Badge.tsx`
Status badge component.

**Variants:**
- success (green)
- warning (yellow)
- danger (red)
- info (blue)
- default (gray)

#### `src/components/UI/Card.tsx`
Container card component.

**Features:**
- Header with title/actions
- Padding variants
- Shadow variants

#### `src/components/UI/StatCard.tsx`
Statistics display card.

**Features:**
- Large number display
- Label
- Icon
- Trend indicator (up/down)
- Color coding

#### `src/components/UI/LoadingSpinner.tsx`
Loading indicator.

**Variants:**
- Spinner (default)
- Dots
- Bars
- Full page overlay

### Hooks

#### `src/hooks/useAuth.ts`
**Purpose:** Manage authentication state.

**Returns:**
- user: Supabase auth user
- session: Supabase session
- profile: Database user profile
- loading: Loading state
- signIn: Login function
- signOut: Logout function
- isAdmin: Admin check

**Key Implementation:**
```typescript
// Fetch session with timeout protection
const timeoutId = setTimeout(() => {
  if (loading) setLoading(false);
}, 10000);

const { data: { session } } = await supabase.auth.getSession();

// Fetch user profile
const { data: userProfile } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle();

setProfile(userProfile);
setLoading(false);
```

#### `src/hooks/usePermissions.ts`
**Purpose:** Check user permissions.

**Returns:**
- hasPermission(permission): Check if user has permission
- hasAnyPermission(permissions): Check if user has any of the permissions
- hasAllPermissions(permissions): Check if user has all permissions

**Implementation:**
```typescript
function hasPermission(permission: string): boolean {
  const role = profile?.role;
  const permissions = ROLE_PERMISSIONS[role];
  return checkPermission(permissions, permission);
}
```

#### `src/hooks/useSupabase.ts`
**Purpose:** Supabase client hook (optional wrapper).

### Libraries

#### `src/lib/supabase.ts`
**Purpose:** Supabase client initialization.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**Environment Variables:**
- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_ANON_KEY: Public anon key
- VITE_SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)

#### `src/lib/stock.ts`
**Purpose:** Stock calculation utilities.

**Key Functions:**

```typescript
// Calculate available stock
export function calculateAvailableStock(
  quantityInStock: number,
  reservedQuantity: number
): number {
  return quantityInStock - reservedQuantity;
}

// Check if product is low stock
export function isLowStock(
  availableStock: number,
  reorderLevel: number
): boolean {
  return availableStock <= reorderLevel;
}

// Reserve stock for order
export async function reserveStock(
  productId: string,
  variantId: string | null,
  storeId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .update({
      reserved_quantity: supabase.raw('reserved_quantity + ?', [quantity])
    })
    .match({ product_id: productId, variant_id: variantId, store_id: storeId });

  if (error) throw error;
}

// Release reserved stock
export async function releaseStock(
  productId: string,
  variantId: string | null,
  storeId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .update({
      reserved_quantity: supabase.raw('reserved_quantity - ?', [quantity])
    })
    .match({ product_id: productId, variant_id: variantId, store_id: storeId });

  if (error) throw error;
}
```

#### `src/lib/inventory-writes.ts`
**Purpose:** Inventory write operations.

**Key Functions:**

```typescript
// Update inventory quantity
export async function updateInventoryQuantity(
  productId: string,
  variantId: string | null,
  storeId: string,
  quantityChange: number,
  reason: string
): Promise<void> {
  // Create adjustment record
  const { data: adjustment } = await supabase
    .from('inventory_adjustments')
    .insert({
      product_id: productId,
      variant_id: variantId,
      store_id: storeId,
      adjustment_type: 'manual',
      quantity_change: quantityChange,
      reason,
      status: 'approved',
      adjusted_by: currentUserId,
      approved_by: currentUserId,
      approved_at: new Date().toISOString()
    })
    .select()
    .single();

  // Apply adjustment via database function
  await supabase.rpc('apply_inventory_adjustment', {
    adjustment_id: adjustment.id
  });
}
```

#### `src/lib/insertDummyData.ts`
**Purpose:** Insert test data for development.

**Warning:** Should only be used in development, never in production.

### Configuration

#### `src/config/permissions.ts`
**Purpose:** Define role-based permissions.

```typescript
export const ROLE_PERMISSIONS = {
  super_admin: {
    users: ['view', 'create', 'edit', 'delete'],
    stores: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    payments: ['view', 'create', 'edit', 'delete'],
    refunds: ['view', 'create', 'edit', 'delete'],
    purchase_management: ['view', 'create', 'edit', 'delete'],
    inventory_adjustments: ['view', 'create', 'edit', 'approve', 'delete'],
    view_profit_analysis: true,
    reports: ['view', 'export'],
    settings: ['view', 'edit'],
  },
  admin: {
    users: ['view', 'create', 'edit'],
    stores: ['view', 'edit'],
    products: ['view', 'create', 'edit'],
    inventory: ['view', 'edit'],
    orders: ['view', 'create', 'edit'],
    payments: ['view'],
    refunds: ['view', 'create', 'edit'],
    purchase_management: ['view', 'create', 'edit'],
    inventory_adjustments: ['view', 'create', 'edit'],
    reports: ['view'],
    settings: ['view'],
  },
  delivery_agent: {
    orders: ['view', 'edit_status'],
  },
  customer: {
    orders: ['view', 'create'],
    support_tickets: ['view', 'create', 'edit'],
  }
};

// Helper to check permission
export function hasPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  if (typeof resourcePermissions === 'boolean') {
    return resourcePermissions;
  }

  return resourcePermissions.includes(action);
}
```

### Types

#### `src/types/database.ts`
**Purpose:** TypeScript types for database tables.

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

// ... more types
```

---

## Database Migrations

### Migration Files

Located in `supabase/migrations/`, SQL files are executed in order by filename timestamp.

#### Key Migrations

##### `20250828101958_lingering_field.sql`
**Purpose:** Initial database schema creation.

**Creates:**
- All core tables (users, stores, products, orders, etc.)
- Relationships and foreign keys
- Indexes for performance
- Basic RLS policies

##### `20251012065738_add_super_admin_role.sql`
**Purpose:** Add super_admin role.

```sql
-- Add super_admin to role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Update is_admin function to include super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### `20251012092006_create_admin_user.sql`
**Purpose:** Create default admin account.

```sql
-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@zepta.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Create profile in users table
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Super Admin',
  'admin@zepta.com',
  'super_admin',
  true
);
```

**Default Credentials:**
- Email: admin@zepta.com
- Password: admin123

##### `20251008080333_create_customer_support_system.sql`
**Purpose:** Create support ticket system.

**Creates:**
- support_tickets table
- support_messages table
- Ticket number auto-generation
- RLS policies for tickets

```sql
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL DEFAULT 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('ticket_number_seq')::text, 6, '0'),
  user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text NOT NULL,
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
```

##### `20251008070039_create_inventory_adjustment_function.sql`
**Purpose:** Create inventory adjustment system.

**Creates:**
- inventory_adjustments table
- apply_inventory_adjustment function
- Approval workflow

```sql
CREATE OR REPLACE FUNCTION apply_inventory_adjustment(adjustment_id uuid)
RETURNS void AS $$
DECLARE
  adj_record inventory_adjustments%ROWTYPE;
BEGIN
  -- Get adjustment details
  SELECT * INTO adj_record
  FROM inventory_adjustments
  WHERE id = adjustment_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Adjustment not found or not approved';
  END IF;

  -- Update inventory
  UPDATE inventory
  SET
    quantity_in_stock = quantity_in_stock + adj_record.quantity_change,
    last_restocked_at = CASE
      WHEN adj_record.adjustment_type = 'restock' THEN now()
      ELSE last_restocked_at
    END,
    updated_at = now()
  WHERE product_id = adj_record.product_id
    AND (variant_id = adj_record.variant_id OR (variant_id IS NULL AND adj_record.variant_id IS NULL))
    AND store_id = adj_record.store_id;

  -- If inventory record doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO inventory (
      product_id,
      variant_id,
      store_id,
      quantity_in_stock,
      reserved_quantity,
      reorder_level
    ) VALUES (
      adj_record.product_id,
      adj_record.variant_id,
      adj_record.store_id,
      adj_record.quantity_change,
      0,
      10
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### `20251012100206_fix_users_table_rls_for_self_read.sql`
**Purpose:** Fix circular dependency in RLS policies.

**Problem:** Policies were calling `is_admin()` function which queried the users table, creating a circular dependency.

**Solution:** Use `auth.uid()` directly instead of database queries.

```sql
-- Drop all conflicting policies
DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_rw" ON users;

-- Create simple self-read policy (no dependencies)
CREATE POLICY "Users can always read own profile"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Create admin policy with inline query (no function call)
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );
```

**Critical:** This migration fixes the infinite loading issue on auth.

---

## Edge Functions

### Overview

Edge Functions are serverless functions that run on Deno runtime at the edge (close to users).

### `create-delivery-agent`

**File:** `supabase/functions/create-delivery-agent/index.ts`

**Purpose:** Create a new delivery agent account with auth credentials.

**Why Edge Function?**
- Requires service_role key to create auth users
- Cannot expose service_role key to frontend
- Need to create both auth.users and users table records atomically

**Implementation:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { email, password, full_name, mobile_number, store_id } = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create user profile
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

**Usage from Frontend:**

```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/create-delivery-agent`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'agent@example.com',
      password: 'password123',
      full_name: 'John Doe',
      mobile_number: '1234567890',
      store_id: 'store-uuid',
    }),
  }
);

const { data, error } = await response.json();
```

---

## How to Use

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd zepta-admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run database migrations**
   Migrations are automatically applied via Supabase CLI or dashboard.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the app**
   Open `http://localhost:5173`

### Default Login

**Email:** admin@zepta.com
**Password:** admin123
**Role:** super_admin

### Creating Users

**Admins/Super Admins:**
1. Login as super_admin
2. Go to Users page
3. Click "Add User"
4. Fill in details and select role
5. User receives credentials via email

**Delivery Agents:**
1. Go to Delivery Agents page
2. Click "Add Delivery Agent"
3. Fill in details
4. Edge function creates account automatically

**Customers:**
- Customers register via the customer-facing app (not admin panel)
- Admins can view/manage customers in Users page

### Managing Products

1. **Create Categories** (Categories page)
   - Add parent categories first
   - Then add subcategories

2. **Add Products** (Products page)
   - Fill in product details
   - Upload images
   - Assign to category
   - Set base price

3. **Add Variants** (Optional)
   - Create variants (size, color, etc.)
   - Set variant prices
   - Each variant gets unique SKU

4. **Set Inventory** (Inventory page)
   - Set stock quantity per store
   - Set reorder levels
   - System tracks reserved quantity automatically

### Processing Orders

1. **New Order Arrives**
   - Status: "pending"
   - Payment status: "pending" or "paid"

2. **Confirm Order**
   - Review order details
   - Check inventory
   - Change status to "confirmed"

3. **Prepare Order**
   - Store prepares items
   - Change status to "preparing"

4. **Assign Delivery Agent**
   - Select available agent
   - Agent receives notification

5. **Out for Delivery**
   - Agent picks up order
   - Status: "out_for_delivery"
   - Track in real-time

6. **Delivered**
   - Agent marks as delivered
   - Status: "delivered"
   - Payment completed

### Managing Inventory

**Receiving Stock:**
1. Create Purchase Order
2. Order arrives from supplier
3. Create Inventory Adjustment (type: "restock")
4. Admin approves
5. Stock updated automatically

**Handling Damages:**
1. Create Inventory Adjustment (type: "damage")
2. Enter quantity and reason
3. Admin approves
4. Stock reduced

**Processing Returns:**
1. Customer returns item
2. Create Inventory Adjustment (type: "return")
3. Inspect item
4. Approve to add back to stock

### Handling Refunds

1. Customer requests refund
2. Verify order and payment
3. Review refund reason
4. Approve refund
5. Process via payment gateway
6. Update payment status to "refunded"

### Support Tickets

**Customer Side:**
1. Raise ticket via app
2. Describe issue
3. Track status

**Admin Side:**
1. View all open tickets
2. Assign to support agent
3. Respond with messages
4. Resolve ticket
5. Customer confirms resolution
6. Ticket closed

### Analytics

**Dashboard:**
- Overview of key metrics
- Recent orders
- Quick stats

**Analytics Page:**
- Detailed charts and trends
- Revenue analysis
- Top products
- Customer insights

**Profit Analysis:**
- Cost vs revenue
- Profit margins by product
- Store profitability
- Category analysis

### Best Practices

1. **Always check permissions**
   - Don't grant unnecessary permissions
   - Use least privilege principle

2. **Approve inventory adjustments carefully**
   - Verify quantity changes
   - Check adjustment reasons
   - Investigate large discrepancies

3. **Monitor low stock alerts**
   - Set appropriate reorder levels
   - Create purchase orders proactively
   - Avoid stockouts

4. **Track order status actively**
   - Update status promptly
   - Assign delivery agents quickly
   - Communicate delays to customers

5. **Handle refunds professionally**
   - Review refund requests fairly
   - Process approved refunds quickly
   - Track refund reasons for insights

6. **Respond to support tickets**
   - Prioritize by urgency
   - Respond within SLA
   - Keep customers informed

7. **Review analytics regularly**
   - Identify trends
   - Optimize inventory
   - Improve profitability

---

## Troubleshooting

### App Stuck on Loading

**Cause:** RLS policy circular dependency.

**Solution:** Run migration `fix_users_table_rls_for_self_read.sql`.

### Cannot Login

**Possible Causes:**
1. Wrong credentials → Check email/password
2. User is inactive → Check is_active in database
3. RLS policy blocking → Check users table policies

### Inventory Not Updating

**Possible Causes:**
1. Adjustment not approved → Approve adjustment
2. RLS policy blocking → Check inventory table policies
3. Function error → Check logs

### Orders Not Visible

**Possible Causes:**
1. Store filter → Select correct store or "All Stores"
2. RLS policy → Check if user has permission
3. No orders → Create test order

### Permission Denied Errors

**Solution:** Check user role and permissions in `permissions.ts`.

---

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live order tracking
   - Real-time inventory updates
   - Live delivery agent tracking

2. **Advanced Analytics**
   - Machine learning for demand forecasting
   - Predictive analytics
   - Customer behavior analysis

3. **Mobile App**
   - React Native mobile app
   - Push notifications
   - Offline support

4. **Payment Gateway Integration**
   - Stripe, Razorpay integration
   - Automatic refund processing
   - Payment reconciliation

5. **Advanced Inventory**
   - Barcode scanning
   - Batch tracking
   - Expiry date management
   - Multi-warehouse support

6. **Marketing Tools**
   - Email campaigns
   - SMS notifications
   - Customer segmentation
   - Loyalty programs

---

## Support

For issues or questions:
- Check this documentation first
- Review console logs for errors
- Check RLS policies in Supabase dashboard
- Verify user permissions
- Contact support team

---

## License

Proprietary - All rights reserved

---

## Contributors

Zepta Development Team

---

**Last Updated:** October 12, 2025
**Version:** 2.0.8
