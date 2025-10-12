/*
  # Fix Users Table RLS Policies - Remove Duplicates and Conflicts

  ## Problem
  The users table has duplicate and conflicting RLS policies from multiple migrations:
  - Policies in both `public` and `app_public` schemas
  - Multiple policies with similar purposes causing conflicts
  - Users cannot read their own profiles due to policy conflicts

  ## Solution
  1. Drop ALL existing RLS policies on users table
  2. Create clean, minimal set of policies:
     - Users can always read their own profile
     - Users can update their own profile
     - Staff (admin/super_admin) can read all users
     - Admins can create/update users
     - Super admins can delete users
     - Delivery agents can read customer info for their orders

  ## Security
  - Self-read is always allowed (critical for login)
  - Staff operations require active admin/super_admin role
  - All policies properly check authentication
*/

-- Drop ALL existing policies on public.users table
DROP POLICY IF EXISTS "Users can always read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Delivery agents can read customers" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "users_sel" ON public.users;
DROP POLICY IF EXISTS "users_ins" ON public.users;
DROP POLICY IF EXISTS "users_upd" ON public.users;
DROP POLICY IF EXISTS "users_del" ON public.users;
DROP POLICY IF EXISTS "users_select_self" ON public.users;
DROP POLICY IF EXISTS "users_ins_service" ON public.users;

-- Drop app_public schema policies if they exist
DROP POLICY IF EXISTS "users_select" ON app_public.users;
DROP POLICY IF EXISTS "users_insert" ON app_public.users;
DROP POLICY IF EXISTS "users_update" ON app_public.users;
DROP POLICY IF EXISTS "users_delete" ON app_public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLEAN POLICIES - Only what we need
-- ============================================================================

-- 1. Self-read: CRITICAL - Users must always be able to read their own profile
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
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

-- 4. Admin insert: Admins and super_admins can create users
CREATE POLICY "users_admin_insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

-- 5. Admin update: Admins and super_admins can update all users
CREATE POLICY "users_admin_update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.is_active = true
    )
  );

-- 6. Super admin delete: Only super_admins can delete users
CREATE POLICY "users_super_admin_delete"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
      AND u.is_active = true
    )
  );

-- 7. Delivery agent read: Delivery agents can read customers for their orders
CREATE POLICY "users_delivery_agent_read_customers"
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

-- 8. Service role: Service role can do anything (for edge functions)
CREATE POLICY "users_service_role_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify policies
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%id = auth.uid()%' THEN '✅ Self-read'
    WHEN cmd = 'UPDATE' AND qual LIKE '%id = auth.uid()%' THEN '✅ Self-update'
    WHEN cmd = 'SELECT' AND qual LIKE '%admin%' THEN '✅ Staff read'
    WHEN cmd = 'INSERT' THEN '✅ Insert'
    WHEN cmd = 'UPDATE' AND qual LIKE '%admin%' THEN '✅ Admin update'
    WHEN cmd = 'DELETE' THEN '✅ Delete'
    WHEN cmd = 'SELECT' AND qual LIKE '%delivery%' THEN '✅ Delivery agent'
    WHEN cmd = 'ALL' THEN '✅ Service role'
    ELSE '❓ Other'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;