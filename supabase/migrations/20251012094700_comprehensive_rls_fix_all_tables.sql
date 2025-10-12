/*
  # Comprehensive RLS Fix for All Tables

  ## Critical Issues Found
  
  1. **Products table** - RLS disabled, no admin policies
  2. **Store_inventory table** - Missing admin write policies (INSERT, UPDATE, DELETE)
  3. **Sales_cost_allocation table** - Only has 1 policy
  4. **Inventory_adjustments** - Has duplicate policies
  5. **Users table** - RLS disabled
  6. **Order_activity_log** - RLS disabled
  
  ## Changes
  
  1. Enable RLS on products, users, and order_activity_log
  2. Add complete admin CRUD policies to all tables
  3. Clean up duplicate policies
  4. Ensure super_admin has access everywhere
*/

-- ============================================================================
-- PRODUCTS TABLE - ENABLE RLS AND ADD POLICIES
-- ============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "delivery_agents_read_products" ON products;

-- Public can view products
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can view all products
CREATE POLICY "Admins can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert products
CREATE POLICY "Admins can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update products
CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete products
CREATE POLICY "Admins can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- PRODUCT_VARIANTS TABLE - ENSURE COMPLETE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can insert variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete variants" ON product_variants;

-- Admins can view all variants
CREATE POLICY "Admins can view all variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert variants
CREATE POLICY "Admins can insert variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update variants
CREATE POLICY "Admins can update variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete variants
CREATE POLICY "Admins can delete variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- STORE_INVENTORY TABLE - ADD MISSING ADMIN WRITE POLICIES
-- ============================================================================

-- Admins can view all inventory
DROP POLICY IF EXISTS "Admins can view all inventory" ON store_inventory;
CREATE POLICY "Admins can view all inventory"
  ON store_inventory
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert inventory
DROP POLICY IF EXISTS "Admins can insert inventory" ON store_inventory;
CREATE POLICY "Admins can insert inventory"
  ON store_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update inventory
DROP POLICY IF EXISTS "Admins can update inventory" ON store_inventory;
CREATE POLICY "Admins can update inventory"
  ON store_inventory
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete inventory
DROP POLICY IF EXISTS "Admins can delete inventory" ON store_inventory;
CREATE POLICY "Admins can delete inventory"
  ON store_inventory
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- INVENTORY_ADJUSTMENTS TABLE - CLEAN UP DUPLICATE POLICIES
-- ============================================================================

-- Drop old duplicate policies
DROP POLICY IF EXISTS "Super admins can create inventory adjustments" ON inventory_adjustments;
DROP POLICY IF EXISTS "Super admins can view inventory adjustments" ON inventory_adjustments;
DROP POLICY IF EXISTS "inventory_adjustments_admin_all" ON inventory_adjustments;

-- Create clean policies
CREATE POLICY "Admins can view all adjustments"
  ON inventory_adjustments
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert adjustments"
  ON inventory_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update adjustments"
  ON inventory_adjustments
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete adjustments"
  ON inventory_adjustments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- SALES_COST_ALLOCATION TABLE - ADD COMPLETE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "sales_cost_allocation_admin_select" ON sales_cost_allocation;

CREATE POLICY "Admins can view all cost allocations"
  ON sales_cost_allocation
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert cost allocations"
  ON sales_cost_allocation
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update cost allocations"
  ON sales_cost_allocation
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete cost allocations"
  ON sales_cost_allocation
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- USERS TABLE - ENABLE RLS AND ADD PROPER POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Keep existing policies but ensure they work
-- Users can read their own profile is already there

-- Ensure admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- ORDER_ACTIVITY_LOG TABLE - ENABLE RLS AND ADD POLICIES
-- ============================================================================

-- Enable RLS on order_activity_log table
ALTER TABLE order_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON order_activity_log;
CREATE POLICY "Admins can view all activity logs"
  ON order_activity_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert activity logs
DROP POLICY IF EXISTS "Admins can insert activity logs" ON order_activity_log;
CREATE POLICY "Admins can insert activity logs"
  ON order_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Users can view their own order activity
DROP POLICY IF EXISTS "Users can view own order activity" ON order_activity_log;
CREATE POLICY "Users can view own order activity"
  ON order_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_activity_log.order_id
      AND (o.customer_id = auth.uid() OR o.delivery_agent_id = auth.uid())
    )
  );

-- ============================================================================
-- AGENT_RATINGS TABLE - ENSURE ADMIN ACCESS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all agent ratings" ON agent_ratings;
CREATE POLICY "Admins can view all agent ratings"
  ON agent_ratings
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- ORDER_RATINGS TABLE - ENSURE ADMIN ACCESS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all order ratings" ON order_ratings;
CREATE POLICY "Admins can view all order ratings"
  ON order_ratings
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update order ratings" ON order_ratings;
CREATE POLICY "Admins can update order ratings"
  ON order_ratings
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete order ratings" ON order_ratings;
CREATE POLICY "Admins can delete order ratings"
  ON order_ratings
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- NOTIFICATIONS TABLE - ENSURE ADMIN ACCESS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON notifications;
CREATE POLICY "Admins can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
CREATE POLICY "Admins can delete notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (is_admin());
