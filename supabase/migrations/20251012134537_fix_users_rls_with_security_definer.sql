/*
  # Fix Users Table RLS - Resolve Infinite Recursion

  ## Problem
  The previous migration created infinite recursion because policies on the users table
  were querying the users table to check if the current user is an admin.

  ## Solution
  Create SECURITY DEFINER functions that bypass RLS to check user roles, then use
  these functions in the policies.

  ## Security
  - Functions use SECURITY DEFINER to bypass RLS when checking roles
  - Functions are simple and only return boolean values
  - Cannot be exploited to read unauthorized data
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_staff_read_all" ON public.users;
DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;
DROP POLICY IF EXISTS "users_super_admin_delete" ON public.users;
DROP POLICY IF EXISTS "users_delivery_agent_read_customers" ON public.users;
DROP POLICY IF EXISTS "users_service_role_all" ON public.users;

-- Create security definer functions to check roles WITHOUT causing recursion
CREATE OR REPLACE FUNCTION public.auth_user_is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
    AND is_active = true
  );
$$;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLEAN POLICIES - Using security definer functions
-- ============================================================================

-- 1. Self-read: Users can always read their own profile
CREATE POLICY "users_read_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Self-update: Users can update their own profile
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Staff read all: Admins and super_admins can read all users
CREATE POLICY "users_staff_read_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.auth_user_is_staff());

-- 4. Admin insert: Admins and super_admins can create users
CREATE POLICY "users_admin_insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_user_is_staff());

-- 5. Admin update: Admins and super_admins can update all users
CREATE POLICY "users_admin_update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.auth_user_is_staff())
  WITH CHECK (public.auth_user_is_staff());

-- 6. Super admin delete: Only super_admins can delete users
CREATE POLICY "users_super_admin_delete"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.auth_user_is_super_admin());

-- 7. Delivery agent read: Delivery agents can read customers for their orders
CREATE POLICY "users_delivery_read_customers"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = users.id
      AND o.delivery_agent_id = auth.uid()
    )
  );

-- 8. Service role: Service role can do anything
CREATE POLICY "users_service_role_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.auth_user_is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_super_admin() TO authenticated;