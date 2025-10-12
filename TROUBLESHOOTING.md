# Troubleshooting Guide

## "Failed to load user profile" Error

### Problem
You see an error modal saying "Failed to load user profile" with a Retry button.

### Cause
This happens when:
1. The auth user exists in `auth.users` but there's no matching row in `public.users`
2. RLS policies are blocking the profile read
3. The user's `is_active` flag is set to `false`

### Solution

#### Step 1: Verify Auth User and Profile Match

Run this query in Supabase SQL Editor:

```sql
-- Check if your auth user has a matching profile
SELECT
  au.id as auth_id,
  au.email as auth_email,
  pu.id as profile_id,
  pu.email as profile_email,
  pu.role,
  pu.is_active
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-email@example.com';
```

If `profile_id` is NULL, the profile doesn't exist. Create it:

```sql
-- Create missing profile (replace with your auth user ID)
INSERT INTO public.users (id, full_name, email, role, is_active)
VALUES (
  'your-auth-user-id',
  'Your Name',
  'your-email@example.com',
  'super_admin',  -- or 'admin', 'delivery_agent', 'customer'
  true
);
```

#### Step 2: Check RLS Policies

Verify RLS policies are applied correctly:

```sql
-- Test if you can read your own profile
SELECT * FROM public.users WHERE id = auth.uid();
```

If this returns no rows when authenticated, RLS policies may need to be reapplied. Run:

```sql
-- Re-apply RLS policies
\i supabase/migrations/20251012120002_rls_final.sql
```

Or manually apply from the migration file.

#### Step 3: Verify User is Active

```sql
-- Check if user is active
SELECT id, email, role, is_active
FROM public.users
WHERE email = 'your-email@example.com';

-- Activate user if needed
UPDATE public.users
SET is_active = true
WHERE email = 'your-email@example.com';
```

## "Auth loading timeout - forcing completion"

### Problem
Console shows "Auth loading timeout - forcing completion" warning.

### Cause
The auth initialization is taking longer than 10 seconds, usually due to:
1. Slow network connection
2. Database query taking too long
3. RLS policy evaluation issues

### Solution

This is usually not critical - the timeout is a safety measure. However, if it happens consistently:

1. Check your network connection
2. Verify Supabase project is not overloaded
3. Check database indexes on frequently queried columns

## Network Errors (ERR_CONNECTION_TIMED_OUT)

### Problem
Console shows network timeout errors for analytics or other resources.

### Cause
External services (like analytics.tiktok.com) are being blocked or timing out.

### Solution

These are typically third-party tracking scripts and don't affect core functionality. You can:
1. Ignore them (they won't break the app)
2. Remove the tracking scripts if not needed
3. Check your ad blocker or firewall settings

## "Failed to execute 'text' on 'Response': body stream already read"

### Problem
Console shows this error related to response body streams.

### Cause
The same response body is being read multiple times, which is not allowed.

### Solution

This is usually from analytics libraries. Update to ensure response bodies are only read once:

```typescript
// Bad
const text1 = await response.text();
const text2 = await response.text(); // Error!

// Good
const text = await response.text();
const data = JSON.parse(text);
```

## Available Admin Accounts

After applying the fixes, these accounts are available:

### Super Admins (Full Access)
- `zeptainternet@gmail.com`
- `sandi.tiru@gmail.com`

### Admins (Read-only on restricted modules)
- `zepta-admin@gmail.com`
- `zeptaadmin1@gmail.com`

**Note**: You'll need to get passwords from Supabase Auth dashboard or reset them.

## Resetting Password

If you don't know the password for an account:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click the three dots → Send password recovery
4. Or use the "Reset Password" option

## Verifying RLS is Working

Test RLS policies with these queries:

```sql
-- Should return your role
SELECT public.current_user_role();

-- Should return true if you're admin or super_admin
SELECT public.is_staff();

-- Should return true if you're super_admin
SELECT public.is_super_admin();
```

## Creating a New Super Admin

```sql
-- 1. Create auth user in Supabase Dashboard → Authentication → Users
--    Or use SQL (requires service role):
--    INSERT INTO auth.users ...

-- 2. Create profile (use the auth user's ID)
INSERT INTO public.users (id, full_name, email, role, is_active)
VALUES (
  'auth-user-id-from-step-1',
  'Admin Name',
  'admin@example.com',
  'super_admin',
  true
);
```

## Still Having Issues?

1. Check browser console for specific error messages
2. Check Supabase logs in Dashboard → Logs
3. Verify environment variables in `.env` are correct
4. Try clearing browser cache and local storage
5. Check if Supabase project is running (not paused)

## Quick Checklist

- [ ] Auth user exists in `auth.users`
- [ ] Profile exists in `public.users` with matching ID
- [ ] User `is_active = true`
- [ ] RLS policies are applied
- [ ] Environment variables are set correctly
- [ ] Network connection is stable
- [ ] Supabase project is not paused
