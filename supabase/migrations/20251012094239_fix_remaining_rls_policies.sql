/*
  # Fix Remaining RLS Policy Issues

  ## Problem
  
  1. Coupons - Missing admin SELECT policy (can't view coupons in admin panel)
  2. Refunds - Has duplicate and conflicting policies
  3. Payments - No RLS enabled at all
  
  ## Solution
  
  Clean up all policies and use consistent is_admin() function approach
  
  ## Changes
  
  1. **Coupons Table**
     - Add admin SELECT policy to view all coupons
     - Replace subquery policies with is_admin()
  
  2. **Refunds Table**
     - Clean up duplicate policies
     - Keep only necessary policies using is_admin()
  
  3. **Payments Table**
     - Enable RLS
     - Add admin policies for full access
     - Add policies for delivery agents and customers to view their own payments
*/

-- ============================================================================
-- COUPONS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policies for coupons
DROP POLICY IF EXISTS "Admins can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON coupons;

-- Add admin SELECT policy to view all coupons
DROP POLICY IF EXISTS "Admins can view all coupons" ON coupons;
CREATE POLICY "Admins can view all coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Recreate admin policies using is_admin() function
CREATE POLICY "Admins can insert coupons"
  ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update coupons"
  ON coupons
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete coupons"
  ON coupons
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- REFUNDS TABLE POLICIES - CLEANUP
-- ============================================================================

-- Drop all the duplicate/conflicting policies
DROP POLICY IF EXISTS "Super admins can create refunds" ON refunds;
DROP POLICY IF EXISTS "Super admins can update refunds" ON refunds;
DROP POLICY IF EXISTS "Super admins can view refunds" ON refunds;
DROP POLICY IF EXISTS "refund_insert" ON refunds;
DROP POLICY IF EXISTS "refund_update" ON refunds;
DROP POLICY IF EXISTS "refund_delete" ON refunds;
DROP POLICY IF EXISTS "refund_read" ON refunds;
DROP POLICY IF EXISTS "refunds_admin" ON refunds;

-- Create clean, simple policies
-- Admins can view all refunds
CREATE POLICY "Admins can view all refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can create refunds
CREATE POLICY "Admins can insert refunds"
  ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update refunds
CREATE POLICY "Admins can update refunds"
  ON refunds
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete refunds
CREATE POLICY "Admins can delete refunds"
  ON refunds
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Customers and delivery agents can view their own order refunds
CREATE POLICY "Users can view own refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = refunds.order_id
      AND (o.customer_id = auth.uid() OR o.delivery_agent_id = auth.uid())
    )
  );

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert payments
CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update payments
CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete payments
CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Customers and delivery agents can view their own order payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
      AND (o.customer_id = auth.uid() OR o.delivery_agent_id = auth.uid())
    )
  );
