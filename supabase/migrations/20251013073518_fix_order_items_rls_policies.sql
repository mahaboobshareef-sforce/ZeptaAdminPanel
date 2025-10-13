/*
  # Fix order_items RLS policies
  
  1. Drop all existing duplicate policies
  2. Create clean policies that allow admin access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "items_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_delete" ON order_items;
DROP POLICY IF EXISTS "customers_create_order_items" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "customers_read_own_order_items" ON order_items;
DROP POLICY IF EXISTS "delivery_agents_read_order_items" ON order_items;
DROP POLICY IF EXISTS "items_sel" ON order_items;
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_update" ON order_items;

-- Create clean policies using is_admin_ctx()
CREATE POLICY "order_items_select_policy"
  ON order_items FOR SELECT
  USING (
    is_admin_ctx() OR
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND (o.customer_id = auth.uid() OR o.delivery_agent_id = auth.uid())
    )
  );

CREATE POLICY "order_items_insert_policy"
  ON order_items FOR INSERT
  WITH CHECK (
    is_admin_ctx() OR
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items_update_policy"
  ON order_items FOR UPDATE
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

CREATE POLICY "order_items_delete_policy"
  ON order_items FOR DELETE
  USING (is_admin_ctx());
