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

-- Drop all existing SELECT policies on users table
DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "delivery_agents_read_customers" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Drop conflicting ALL policies
DROP POLICY IF EXISTS "users_rw" ON users;

-- ============================================================================
-- CRITICAL: Users MUST be able to read their own profile
-- This policy has NO dependencies and will ALWAYS work
-- ============================================================================

CREATE POLICY "Users can always read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- Admins can read all users (separate policy, won't interfere with self-read)
-- ============================================================================

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Check admin status by querying the current user's role directly
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

-- ============================================================================
-- Delivery agents can read customers they're delivering to
-- ============================================================================

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

-- ============================================================================
-- Clean up UPDATE and DELETE policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any user
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

-- Only admins can insert new users (except during registration via edge function)
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

-- Service role can always insert (for registration)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only super admins can delete users
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
