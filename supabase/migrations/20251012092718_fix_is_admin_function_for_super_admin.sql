/*
  # Fix is_admin Function to Include super_admin

  The is_admin() function was only checking for 'admin' role,
  but it needs to also return true for 'super_admin' role.

  ## Changes
  
  1. **Update is_admin() function**
     - Check for both 'admin' and 'super_admin' roles
     - Keep the is_active check
  
  2. **Update is_admin_ctx() function**
     - Check for both 'admin' and 'super_admin' roles
     - Keep the is_active check
*/

-- Drop and recreate is_admin function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
    AND COALESCE(u.is_active, true)
  );
$$;

-- Drop and recreate is_admin_ctx function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin_ctx()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
    AND COALESCE(u.is_active, true)
  );
$$;
