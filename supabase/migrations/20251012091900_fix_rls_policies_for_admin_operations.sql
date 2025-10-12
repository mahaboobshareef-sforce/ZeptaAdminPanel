/*
  # Fix RLS Policies for Admin Operations

  This migration fixes RLS policies to allow admin users to perform all operations.
  The service role key bypasses RLS, but when using the anon key with JWT tokens,
  we need proper policies for authenticated admin users.

  ## Changes
  
  1. **Categories Table**
     - Add INSERT policy for authenticated admin/super_admin users
     - Add UPDATE policy for authenticated admin/super_admin users
     - Add DELETE policy for authenticated admin/super_admin users
  
  2. **Stores Table**
     - Add INSERT policy for authenticated admin/super_admin users
     - Add UPDATE policy for authenticated admin/super_admin users
     - Add DELETE policy for authenticated admin/super_admin users
  
  3. **Coupons Table**
     - Add INSERT policy for authenticated admin/super_admin users
     - Add UPDATE policy for authenticated admin/super_admin users
     - Add DELETE policy for authenticated admin/super_admin users
  
  4. **Promotional Banners Table**
     - Add INSERT policy for authenticated admin/super_admin users
     - Add UPDATE policy for authenticated admin/super_admin users
     - Add DELETE policy for authenticated admin/super_admin users
*/

-- Categories policies
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

-- Stores policies
DROP POLICY IF EXISTS "Admins can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;

CREATE POLICY "Admins can insert stores"
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can update stores"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can delete stores"
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

-- Coupons policies
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;

CREATE POLICY "Admins can insert coupons"
  ON public.coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can update coupons"
  ON public.coupons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can delete coupons"
  ON public.coupons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

-- Promotional Banners policies
DROP POLICY IF EXISTS "Admins can insert banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.promotional_banners;

CREATE POLICY "Admins can insert banners"
  ON public.promotional_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can update banners"
  ON public.promotional_banners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can delete banners"
  ON public.promotional_banners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );
