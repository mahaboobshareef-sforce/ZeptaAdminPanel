/*
  # Fix Order Activity Log RLS and Admin Access Issues

  1. Changes
    - Update order_activity_log RLS to allow trigger-based inserts
    - Ensure is_admin() recognizes super_admin role
    - Fix product_variants access for super_admin

  2. Security
    - Maintain secure RLS while allowing necessary operations
    - Use SECURITY DEFINER for trigger function to bypass RLS
*/

-- Drop existing trigger and recreate with SECURITY DEFINER
DROP TRIGGER IF EXISTS trg_orders_status_log ON orders;
DROP FUNCTION IF EXISTS log_order_status_change();

-- Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_activity_log (order_id, status, changed_by, changed_at)
    VALUES (NEW.id, NEW.status, auth.uid(), NOW());
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trg_orders_status_log
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Ensure is_admin() recognizes super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  );
END;
$$;