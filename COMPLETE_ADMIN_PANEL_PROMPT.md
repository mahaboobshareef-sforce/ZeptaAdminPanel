# 🎯 Complete E-Commerce Admin Dashboard - Production Ready

Build a **modern, production-grade admin dashboard** for a multi-vendor e-commerce platform called "Zepta" with the following specifications:

## 🏗️ Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (clean, modern design - NO purple/indigo colors)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **State**: React Query for server state
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast

## 👥 User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access, can manage other admins
2. **Admin** - Full access except admin management
3. **Staff** - Limited access (view orders, manage inventory)
4. **Customer** - (Not for this dashboard, but exists in DB)
5. **Delivery Agent** - (Not for this dashboard, but exists in DB)

### Role-Based Access Control (RBAC)
```typescript
Permissions:
- users.view / users.create / users.edit / users.delete
- products.view / products.create / products.edit / products.delete
- orders.view / orders.edit / orders.cancel
- inventory.view / inventory.adjust
- analytics.view
- settings.view / settings.edit
- stores.manage
- deliveryAgents.manage
```

## 🗄️ Database Schema

### Core Tables

**1. users**
```sql
- id: uuid (PK, auth.uid())
- email: text (unique, not null)
- full_name: text
- phone: text
- role: enum ('customer', 'delivery_agent', 'staff', 'admin', 'super_admin')
- is_active: boolean (default: true)
- created_at: timestamptz
- updated_at: timestamptz
```

**2. stores**
```sql
- id: uuid (PK)
- name: text (not null)
- description: text
- address: text
- city: text
- state: text
- pincode: text
- phone: text
- email: text
- is_active: boolean (default: true)
- operating_hours: jsonb
- created_at: timestamptz
```

**3. categories**
```sql
- id: uuid (PK)
- name: text (not null)
- slug: text (unique)
- description: text
- image_url: text
- parent_category_id: uuid (FK -> categories.id, nullable)
- is_active: boolean (default: true)
- display_order: integer
```

**4. products**
```sql
- id: uuid (PK)
- name: text (not null)
- slug: text (unique)
- description: text
- category_id: uuid (FK -> categories.id)
- base_price: decimal(10,2)
- cost_price: decimal(10,2)
- mrp: decimal(10,2)
- sku: text (unique)
- barcode: text
- images: text[] (array of URLs)
- is_active: boolean (default: true)
- is_featured: boolean (default: false)
- tags: text[]
- created_at: timestamptz
- updated_at: timestamptz
```

**5. product_variants**
```sql
- id: uuid (PK)
- product_id: uuid (FK -> products.id)
- name: text (e.g., "500g", "Red/Large")
- sku: text (unique)
- price: decimal(10,2)
- cost_price: decimal(10,2)
- attributes: jsonb (e.g., {size: "L", color: "Red"})
- is_active: boolean (default: true)
```

**6. inventory**
```sql
- id: uuid (PK)
- product_id: uuid (FK -> products.id)
- variant_id: uuid (FK -> product_variants.id, nullable)
- store_id: uuid (FK -> stores.id)
- quantity: integer (not null, default: 0)
- reserved_quantity: integer (default: 0)
- reorder_level: integer
- reorder_quantity: integer
- last_restocked_at: timestamptz
- UNIQUE(product_id, variant_id, store_id)
```

**7. inventory_adjustments**
```sql
- id: uuid (PK)
- product_id: uuid (FK -> products.id)
- variant_id: uuid (FK -> product_variants.id, nullable)
- store_id: uuid (FK -> stores.id)
- adjustment_type: enum ('restock', 'damage', 'theft', 'correction', 'return')
- quantity_change: integer (can be negative)
- reason: text
- notes: text
- adjusted_by: uuid (FK -> users.id)
- created_at: timestamptz
```

**8. orders**
```sql
- id: uuid (PK)
- order_number: text (unique, auto-generated)
- customer_id: uuid (FK -> users.id)
- store_id: uuid (FK -> stores.id)
- delivery_agent_id: uuid (FK -> users.id, nullable)
- status: enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')
- payment_status: enum ('pending', 'paid', 'failed', 'refunded')
- payment_method: enum ('cod', 'online', 'wallet')
- subtotal: decimal(10,2)
- discount_amount: decimal(10,2) (default: 0)
- delivery_fee: decimal(10,2) (default: 0)
- tax_amount: decimal(10,2) (default: 0)
- total_amount: decimal(10,2)
- delivery_address: jsonb
- notes: text
- created_at: timestamptz
- updated_at: timestamptz
```

**9. order_items**
```sql
- id: uuid (PK)
- order_id: uuid (FK -> orders.id)
- product_id: uuid (FK -> products.id)
- variant_id: uuid (FK -> product_variants.id, nullable)
- quantity: integer (not null)
- unit_price: decimal(10,2)
- unit_cost_price: decimal(10,2)
- total_price: decimal(10,2)
- discount_amount: decimal(10,2) (default: 0)
```

**10. coupons**
```sql
- id: uuid (PK)
- code: text (unique, not null)
- description: text
- discount_type: enum ('percentage', 'fixed', 'free_delivery')
- discount_value: decimal(10,2)
- min_order_value: decimal(10,2)
- max_discount: decimal(10,2) (nullable)
- usage_limit: integer (nullable)
- usage_count: integer (default: 0)
- valid_from: timestamptz
- valid_until: timestamptz
- is_active: boolean (default: true)
- applicable_categories: uuid[] (nullable)
- applicable_products: uuid[] (nullable)
```

**11. promotional_banners**
```sql
- id: uuid (PK)
- title: text (not null)
- image_url: text (not null)
- link_url: text
- display_order: integer
- is_active: boolean (default: true)
- valid_from: timestamptz
- valid_until: timestamptz
- created_at: timestamptz
```

**12. delivery_agents**
```sql
- id: uuid (PK, FK -> users.id)
- vehicle_type: text
- vehicle_number: text
- license_number: text
- is_available: boolean (default: true)
- current_location: point (PostGIS)
- rating: decimal(2,1)
- total_deliveries: integer (default: 0)
```

**13. support_tickets**
```sql
- id: uuid (PK)
- ticket_number: text (unique, auto-generated)
- user_id: uuid (FK -> users.id)
- order_id: uuid (FK -> orders.id, nullable)
- category: enum ('order_issue', 'payment', 'product', 'delivery', 'technical', 'other')
- priority: enum ('low', 'medium', 'high', 'urgent')
- status: enum ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')
- subject: text (not null)
- description: text (not null)
- assigned_to: uuid (FK -> users.id, nullable)
- created_at: timestamptz
- updated_at: timestamptz
- resolved_at: timestamptz (nullable)
```

**14. ticket_messages**
```sql
- id: uuid (PK)
- ticket_id: uuid (FK -> support_tickets.id)
- sender_id: uuid (FK -> users.id)
- message: text (not null)
- attachments: text[] (URLs)
- is_internal: boolean (default: false)
- created_at: timestamptz
```

**15. notifications**
```sql
- id: uuid (PK)
- user_id: uuid (FK -> users.id)
- type: enum ('order', 'payment', 'delivery', 'system', 'support')
- title: text (not null)
- message: text (not null)
- data: jsonb (additional metadata)
- is_read: boolean (default: false)
- created_at: timestamptz
```

**16. ratings**
```sql
- id: uuid (PK)
- order_id: uuid (FK -> orders.id)
- product_id: uuid (FK -> products.id)
- customer_id: uuid (FK -> users.id)
- delivery_agent_id: uuid (FK -> users.id, nullable)
- product_rating: integer (1-5, nullable)
- delivery_rating: integer (1-5, nullable)
- review_text: text
- images: text[]
- is_verified_purchase: boolean (default: true)
- is_approved: boolean (default: false)
- created_at: timestamptz
```

**17. user_settings**
```sql
- id: uuid (PK)
- user_id: uuid (FK -> users.id, unique)
- theme: text (default: 'light')
- language: text (default: 'en')
- notifications_enabled: boolean (default: true)
- email_notifications: boolean (default: true)
- preferences: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

## 🔐 Security Requirements

### Row Level Security (RLS)
- **Enable RLS on ALL tables**
- **NEVER use `USING (true)` policies**
- All policies must check authentication and authorization
- Use helper functions to avoid circular dependencies:

```sql
-- Helper function for role checking
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
$$;

-- Helper function for staff checking
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'super_admin')
    AND is_active = true
  );
$$;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;
```

### RLS Policy Examples
```sql
-- Users can read their own profile
CREATE POLICY "users_select_own" ON users
FOR SELECT TO authenticated
USING (id = auth.uid() OR is_admin());

-- Only admins can insert users
CREATE POLICY "users_insert_admin_only" ON users
FOR INSERT TO authenticated
WITH CHECK (is_admin());

-- Products readable by staff and above
CREATE POLICY "products_select" ON products
FOR SELECT TO authenticated
USING (is_staff_or_admin());

-- Orders readable by staff and above
CREATE POLICY "orders_select" ON orders
FOR SELECT TO authenticated
USING (is_staff_or_admin());

-- Inventory adjustments require staff role
CREATE POLICY "inventory_adjustments_insert" ON inventory_adjustments
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin());
```

## 🎨 Dashboard Features & Pages

### 1. Dashboard (Home)
- **KPI Cards**: Total Revenue, Total Orders, Active Products, Active Users
- **Revenue Chart**: Last 30 days line chart
- **Recent Orders Table**: Last 10 orders with status
- **Low Stock Alerts**: Products with quantity < reorder_level
- **Top Selling Products**: Chart + table

### 2. Orders Management
- **List View**: Filterable table (status, date range, payment status)
- **Search**: By order number, customer name, phone
- **Filters**: Status, payment status, date range, store
- **Actions**: View details, change status, assign delivery agent, print invoice
- **Order Details Modal**:
  - Customer info
  - Items list with images
  - Status timeline
  - Payment info
  - Delivery address
  - Activity log
  - Ability to cancel/refund

### 3. Products Management
- **List View**: Grid + Table toggle
- **CRUD Operations**: Create, Read, Update, Delete
- **Bulk Actions**: Activate/Deactivate, Delete multiple
- **Features**:
  - Multiple images upload (placeholder: use Pexels URLs)
  - Category assignment
  - Variant management (size, color, etc.)
  - Pricing (MRP, cost price, selling price)
  - SKU & barcode
  - Tags & featured flag
- **Product Details**: Full view with all variants and inventory

### 4. Inventory Management
- **Stock Levels**: Table showing all products with current stock
- **Filters**: Store, low stock, out of stock
- **Quick Adjust**: Inline editing for stock quantities
- **Inventory Adjustments Page**:
  - Add new adjustment (restock, damage, etc.)
  - History table with filters
  - Export to CSV
- **Low Stock Alerts**: Red indicators for items below reorder level

### 5. Bulk Inventory Upload
- **CSV Upload**: Template download, drag-drop upload
- **Preview**: Show parsed data before import
- **Validation**: Check SKU existence, quantity validity
- **Import**: Batch insert with progress indicator

### 6. Categories Management
- **Tree View**: Hierarchical category display
- **CRUD**: Add, edit, delete, reorder
- **Nested Categories**: Support for parent-child relationships
- **Image Upload**: Category banners (Pexels URLs)

### 7. Users Management
- **List View**: All users with filters (role, status)
- **CRUD**: Create staff/admin users
- **Actions**: Activate/deactivate, change role, reset password
- **User Details**: View orders, support tickets, activity

### 8. Delivery Agents
- **List View**: All agents with availability status
- **CRUD**: Add, edit, deactivate agents
- **Performance Metrics**: Total deliveries, rating, on-time %
- **Assign to Orders**: From order details page

### 9. Stores Management
- **List View**: All stores with status
- **CRUD**: Add, edit, deactivate stores
- **Store Details**: Address, contact, operating hours
- **Inventory by Store**: View stock levels per store

### 10. Coupons Management
- **List View**: Active, expired, upcoming coupons
- **CRUD**: Create, edit, deactivate coupons
- **Features**:
  - Code generation
  - Discount types (%, fixed, free delivery)
  - Min order value
  - Usage limits
  - Date range
  - Applicable categories/products
- **Usage Stats**: How many times used

### 11. Promotional Banners
- **List View**: All banners with preview
- **CRUD**: Add, edit, delete, reorder
- **Features**:
  - Image upload (Pexels URLs)
  - Link URL
  - Display order (drag-drop reorder)
  - Schedule (valid from/until)
  - Active/inactive toggle

### 12. Support Tickets
- **Dashboard**: Open, in-progress, resolved counts
- **List View**: Filterable by status, priority, category
- **Ticket Details**:
  - Full conversation thread
  - Assign to staff
  - Change status, priority
  - Add internal notes
  - Link to related order
  - Attach files
- **Real-time Updates**: New messages appear automatically

### 13. Ratings & Reviews
- **List View**: All product reviews with filters
- **Actions**: Approve, reject, respond to reviews
- **Filters**: Product, rating (1-5 stars), verified purchase
- **Delivery Ratings**: Separate section for delivery agent ratings

### 14. Analytics & Reports
- **Revenue Analytics**:
  - Total revenue, profit margin
  - Revenue by store, category, product
  - Date range selector
  - Export to CSV/PDF
- **Order Analytics**:
  - Orders by status
  - Orders by payment method
  - Average order value
  - Orders by time (hour, day, week, month)
- **Product Analytics**:
  - Top selling products
  - Revenue by category
  - Stock turnover rate
- **Customer Analytics**:
  - New customers vs returning
  - Customer lifetime value
  - Order frequency

### 15. Profit Analysis
- **Profit Margin Calculator**:
  - Revenue vs Cost
  - Profit by product
  - Profit by category
  - Profit trends over time
- **Expense Tracking**: Delivery costs, discounts given

### 16. Payment Management
- **Transaction List**: All payments with filters
- **Payment Methods**: COD, Online breakdown
- **Failed Payments**: List with retry options
- **Refunds**: Process refunds, refund history

### 17. Refunds Management
- **Refund Requests**: Pending approval
- **Process Refund**: Approve/reject with reason
- **Refund History**: Completed refunds with audit trail

### 18. Purchase Management (Advanced)
- **Purchase Orders**: Create POs for suppliers
- **Supplier Management**: Add, edit suppliers
- **Received Stock**: Mark POs as received, auto-update inventory
- **Pending Orders**: Track what's on order

### 19. Settings
- **General Settings**:
  - Business name, logo
  - Contact info
  - Currency, timezone
  - Tax rates
  - Delivery charges
- **Email Templates**: Order confirmation, delivery updates
- **App Settings**: Maintenance mode, version
- **User Preferences**: Theme (light/dark), language

## 🎨 Design Requirements

### UI/UX Standards
- **Clean, Modern Design**: No purple/indigo (use blues, grays, greens)
- **Responsive**: Mobile, tablet, desktop breakpoints
- **Consistent Layout**:
  - Sidebar navigation (collapsible)
  - Top header (user menu, notifications)
  - Breadcrumbs
  - Page title + action button
- **Components**:
  - Tables with sorting, pagination, search
  - Forms with validation
  - Modals for details/forms
  - Toast notifications
  - Loading states
  - Empty states
  - Error states
- **Accessibility**: ARIA labels, keyboard navigation, focus states
- **Icons**: Lucide React (consistent throughout)

### Color Palette
```css
Primary: Blue (#3B82F6)
Success: Green (#10B981)
Warning: Amber (#F59E0B)
Error: Red (#EF4444)
Gray Scale: slate-50 to slate-900
Backgrounds: white, slate-50, slate-100
```

## 🔧 Technical Requirements

### Authentication Flow
```typescript
1. Login page (/login)
2. Check auth state on mount
3. Fetch user profile from users table
4. Check role and permissions
5. Redirect based on role:
   - super_admin, admin, staff → /dashboard
   - customer, delivery_agent → Show error (wrong portal)
6. Protected routes check auth + role
```

### Code Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Table.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       └── Badge.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── Products.tsx
│   ├── Inventory.tsx
│   ├── BulkInventory.tsx
│   ├── Categories.tsx
│   ├── Users.tsx
│   ├── DeliveryAgents.tsx
│   ├── Stores.tsx
│   ├── Coupons.tsx
│   ├── Banners.tsx
│   ├── SupportTickets.tsx
│   ├── Ratings.tsx
│   ├── Analytics.tsx
│   ├── ProfitAnalysis.tsx
│   ├── Payments.tsx
│   ├── Refunds.tsx
│   ├── PurchaseManagement.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase.ts
│   └── permissions.ts
├── types/
│   └── database.ts
├── config/
│   └── permissions.ts
└── App.tsx
```

### Database Functions
Create these helper functions:

```sql
-- Apply inventory adjustment (with variant support)
CREATE OR REPLACE FUNCTION apply_inventory_adjustment(
  p_product_id uuid,
  p_variant_id uuid,
  p_store_id uuid,
  p_adjustment_type text,
  p_quantity_change integer,
  p_reason text,
  p_notes text,
  p_adjusted_by uuid
) RETURNS void AS $$
BEGIN
  -- Log the adjustment
  INSERT INTO inventory_adjustments (
    product_id, variant_id, store_id, adjustment_type,
    quantity_change, reason, notes, adjusted_by
  ) VALUES (
    p_product_id, p_variant_id, p_store_id, p_adjustment_type,
    p_quantity_change, p_reason, p_notes, p_adjusted_by
  );

  -- Update inventory
  UPDATE inventory
  SET quantity = quantity + p_quantity_change,
      last_restocked_at = CASE
        WHEN p_adjustment_type = 'restock' THEN now()
        ELSE last_restocked_at
      END
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND store_id = p_store_id;

  -- Create inventory record if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO inventory (product_id, variant_id, store_id, quantity)
    VALUES (p_product_id, p_variant_id, p_store_id, GREATEST(p_quantity_change, 0));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM orders;
  new_number := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM support_tickets;
  new_number := 'TKT' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

### Triggers
```sql
-- Auto-create user profile when auth.users record created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📦 Installation & Setup

```bash
# Create project
npm create vite@latest zepta-admin -- --template react-ts
cd zepta-admin

# Install dependencies
npm install @supabase/supabase-js react-router-dom @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts date-fns lucide-react clsx
npm install react-hot-toast

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🚀 Environment Setup

Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 Testing Scenarios

Create test scripts for:
1. User registration (all roles)
2. Product creation with variants
3. Inventory adjustments
4. Order creation → inventory reduction
5. Order cancellation → inventory restoration
6. Support ticket lifecycle
7. Coupon validation
8. Payment processing

## 🎯 Success Criteria

✅ All CRUD operations work
✅ RLS policies prevent unauthorized access
✅ No console errors
✅ Responsive on all devices
✅ Fast page loads (< 2s)
✅ Real-time updates work
✅ Forms validate correctly
✅ Images load properly
✅ Search/filters work
✅ Charts render correctly
✅ Build succeeds without errors

## 🚨 Critical Notes

1. **ALWAYS enable RLS on every table**
2. **NEVER use USING (true) in policies**
3. **Use SECURITY DEFINER functions to break circular dependencies**
4. **Handle inventory atomically (use transactions)**
5. **Validate all inputs (both client and DB level)**
6. **Use proper indexes for performance**
7. **Implement soft deletes (is_active flag)**
8. **Log all critical actions (order changes, inventory adjustments)**
9. **Handle edge cases (out of stock, concurrent orders)**
10. **Test with real data at scale**

## 🔄 Development Workflow

1. **Phase 1**: Database setup (migrations, RLS, functions, triggers)
2. **Phase 2**: Authentication system
3. **Phase 3**: Core UI components (Layout, Table, Modal, etc.)
4. **Phase 4**: Dashboard and analytics
5. **Phase 5**: Product management
6. **Phase 6**: Order management
7. **Phase 7**: Inventory management
8. **Phase 8**: User and delivery agent management
9. **Phase 9**: Support system
10. **Phase 10**: Settings and configuration
11. **Phase 11**: Testing and optimization
12. **Phase 12**: Deployment

## 📊 Performance Optimization

- Use React Query for caching
- Implement pagination (50 items per page)
- Lazy load images
- Code splitting by route
- Debounce search inputs
- Index database columns used in WHERE/JOIN
- Use database views for complex queries
- Optimize images (WebP format, responsive sizes)

## 🔒 Security Best Practices

- Sanitize all user inputs
- Use prepared statements (Supabase does this automatically)
- Implement rate limiting on API calls
- Log all admin actions
- Use HTTPS only
- Enable Supabase's built-in security features
- Regular security audits
- Keep dependencies updated

## 📱 Responsive Breakpoints

```css
sm: 640px   // Small devices (phones)
md: 768px   // Medium devices (tablets)
lg: 1024px  // Large devices (desktops)
xl: 1280px  // Extra large devices (large desktops)
2xl: 1536px // 2X Extra large devices
```

## 🎨 Component Examples

### Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}
```

### Table Component
```typescript
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sortable?: boolean;
  searchable?: boolean;
}
```

### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}
```

## 🚀 Deployment Checklist

- [ ] All migrations run successfully
- [ ] RLS policies tested and verified
- [ ] Default super_admin user created
- [ ] Environment variables configured
- [ ] Build succeeds without errors or warnings
- [ ] All routes accessible
- [ ] Authentication flow works
- [ ] Authorization works (role-based access)
- [ ] Forms validate correctly
- [ ] Error handling works
- [ ] Loading states implemented
- [ ] Responsive on all devices
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Documentation updated

## 📚 Additional Resources

- Supabase Documentation: https://supabase.com/docs
- React Query Documentation: https://tanstack.com/query/latest
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- React Hook Form Documentation: https://react-hook-form.com
- Recharts Documentation: https://recharts.org

---

**Start with the database schema and migrations first, then build the UI progressively. Focus on one feature at a time and ensure it's fully working before moving to the next.**
