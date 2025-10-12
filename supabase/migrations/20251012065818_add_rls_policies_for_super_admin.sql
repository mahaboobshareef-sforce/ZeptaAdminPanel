/*
  # Add Row Level Security Policies for Super Admin Role

  1. Security Changes
    - Restrict access to sensitive financial and inventory tables
    - Only super_admin role can access:
      * payments table (view transactions)
      * refunds table (manage refunds)
      * inventory_adjustments table (view/create adjustments)
    - Regular admin role will be blocked at database level
  
  2. Tables Affected
    - payments: Super admin can view all payment records
    - refunds: Super admin can manage (view, create, update) refunds
    - inventory_adjustments: Super admin can view and create adjustments
  
  3. Notes
    - These policies enforce permissions at the database level
    - Even if frontend is bypassed, database blocks unauthorized access
    - Admins will get permission denied errors if they try to access these tables
    - Existing functionality for super_admins remains unchanged
*/

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Super admins can view payments" ON payments;
DROP POLICY IF EXISTS "Super admins can manage refunds" ON refunds;
DROP POLICY IF EXISTS "Super admins can view inventory adjustments" ON inventory_adjustments;
DROP POLICY IF EXISTS "Super admins can create inventory adjustments" ON inventory_adjustments;

-- PAYMENTS TABLE: Super Admin can view all payments
CREATE POLICY "Super admins can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- REFUNDS TABLE: Super Admin can manage refunds (SELECT, INSERT, UPDATE)
CREATE POLICY "Super admins can view refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can create refunds"
  ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update refunds"
  ON refunds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- INVENTORY_ADJUSTMENTS TABLE: Super Admin can view and create adjustments
CREATE POLICY "Super admins can view inventory adjustments"
  ON inventory_adjustments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can create inventory adjustments"
  ON inventory_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );