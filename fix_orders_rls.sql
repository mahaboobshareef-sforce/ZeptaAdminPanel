-- Fix Orders RLS Policies
-- This script removes all conflicting policies and creates clean, working ones

-- Drop all existing orders policies
DROP POLICY IF EXISTS "orders_delete" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "customers_create_orders" ON orders;
DROP POLICY IF EXISTS "customers_read_own_orders" ON orders;
DROP POLICY IF EXISTS "customers_update_own_pending_orders" ON orders;
DROP POLICY IF EXISTS "delivery_agents_read_assigned_orders" ON orders;
DROP POLICY IF EXISTS "delivery_agents_update_assigned_orders" ON orders;
DROP POLICY IF EXISTS "orders_staff_all" ON orders;
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
DROP POLICY IF EXISTS "orders_update_agent" ON orders;
DROP POLICY IF EXISTS "orders_update_customer" ON orders;

-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION is_admin_ctx()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin',
    false
  ) OR COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_customer_ctx()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'customer',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agent_ctx()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'delivery_agent',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' IN ('staff', 'admin', 'super_admin'),
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create new clean policies for orders table

-- SELECT: Admins see all, customers see own, agents see assigned
CREATE POLICY "orders_select"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    is_admin_ctx()
    OR is_staff()
    OR customer_id = auth.uid()
    OR delivery_agent_id = auth.uid()
  );

-- INSERT: Anyone authenticated can create (for customers placing orders)
CREATE POLICY "orders_insert"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Admins/staff can update all, customers can update own pending, agents can update assigned
CREATE POLICY "orders_update"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_ctx()
    OR is_staff()
    OR (is_customer_ctx() AND customer_id = auth.uid())
    OR (is_agent_ctx() AND delivery_agent_id = auth.uid())
  )
  WITH CHECK (
    is_admin_ctx()
    OR is_staff()
    OR (is_customer_ctx() AND customer_id = auth.uid())
    OR (is_agent_ctx() AND delivery_agent_id = auth.uid())
  );

-- DELETE: Only admins and staff
CREATE POLICY "orders_delete"
  ON orders
  FOR DELETE
  TO authenticated
  USING (is_admin_ctx() OR is_staff());

-- Verify policies were created
SELECT
  policyname,
  cmd,
  CASE
    WHEN LENGTH(qual) > 50 THEN LEFT(qual, 47) || '...'
    ELSE qual
  END as qual_preview
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;
