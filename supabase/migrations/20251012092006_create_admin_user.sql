/*
  # Create Admin User

  Creates an admin user in auth.users and public.users tables for testing.
  
  **Credentials:**
  - Email: admin@zepta.com
  - Password: Admin@123
  - Role: super_admin

  This user can be used to log into the admin dashboard and perform all operations.
*/

-- Create auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@zepta.com',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin User"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create profile in public.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  mobile_number,
  role,
  store_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@zepta.com',
  'Admin User',
  NULL,
  'super_admin',
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', is_active = true;
