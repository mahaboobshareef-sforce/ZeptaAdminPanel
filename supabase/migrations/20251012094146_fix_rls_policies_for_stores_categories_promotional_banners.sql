/*
  # Fix RLS Policies for Stores, Categories, and Promotional Banners

  ## Problem
  
  1. Stores - Admins can't see inactive stores due to restrictive SELECT policy
  2. Categories - May have circular dependency issues with subquery policies
  3. Promotional Banners - No RLS policies at all, causing all operations to fail
  
  ## Solution
  
  Use the is_admin() helper function instead of inline subqueries to avoid
  circular dependencies and simplify policy logic.
  
  ## Changes
  
  1. **Stores Table**
     - Add admin-specific SELECT policy to see all stores
     - Keep public read for active stores only
     - Use is_admin() function for all admin policies
  
  2. **Categories Table**
     - Replace subquery policies with is_admin() function
     - Keep public read access
  
  3. **Promotional Banners Table**
     - Add complete RLS policies (currently missing!)
     - Enable RLS on promotional_banners table
     - Allow admins full CRUD access
     - Allow public read for active banners within date range
*/

-- ============================================================================
-- STORES TABLE POLICIES
-- ============================================================================

-- Drop existing admin policies for stores
DROP POLICY IF EXISTS "Admins can insert stores" ON stores;
DROP POLICY IF EXISTS "Admins can update stores" ON stores;
DROP POLICY IF EXISTS "Admins can delete stores" ON stores;

-- Add admin SELECT policy to see all stores
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;
CREATE POLICY "Admins can view all stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Recreate admin policies using is_admin() function
CREATE POLICY "Admins can insert stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Drop existing admin policies for categories
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Add admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
CREATE POLICY "Admins can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Recreate admin policies using is_admin() function
CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- PROMOTIONAL BANNERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on promotional_banners table (if not already enabled)
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can view active banners" ON promotional_banners;
DROP POLICY IF EXISTS "Admins can view all banners" ON promotional_banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON promotional_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON promotional_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON promotional_banners;

-- Public can view active banners within date range
CREATE POLICY "Public can view active banners"
  ON promotional_banners
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' 
    AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
    AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
  );

-- Admins can view all banners
CREATE POLICY "Admins can view all banners"
  ON promotional_banners
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert banners
CREATE POLICY "Admins can insert banners"
  ON promotional_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update banners
CREATE POLICY "Admins can update banners"
  ON promotional_banners
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete banners
CREATE POLICY "Admins can delete banners"
  ON promotional_banners
  FOR DELETE
  TO authenticated
  USING (is_admin());
