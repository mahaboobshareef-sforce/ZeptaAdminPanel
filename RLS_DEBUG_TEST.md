# RLS Debug Test Instructions

## IMPORTANT: Run These Steps to Verify Dashboard Auth

### Step 1: Open Browser Console

1. Open the admin dashboard in your browser
2. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. Go to the "Console" tab

### Step 2: Import and Run Debug Function

In the browser console, paste this code and press Enter:

```javascript
// Import debug function
import('/src/lib/orders-debug.ts').then(module => {
  window.debugOrdersAccess = module.debugOrdersAccess;
  console.log('✅ Debug function loaded! Run: debugOrdersAccess()');
});
```

Then run:

```javascript
await debugOrdersAccess();
```

### Step 3: Interpret Results

The debug function will show:

1. ✅ **Auth state** - Are you logged in with the correct user ID?
2. ✅ **Profile data** - Can you read your own profile? What's your role?
3. ✅ **is_staff() test** - Does the database function work?
4. ✅ **Orders query** - Can you SELECT from orders table?
5. ✅ **Orders count** - How many orders are visible?

### Expected Results for Admin User:

```
🔍 ===== ORDERS RLS DEBUG REPORT =====

1️⃣ Checking auth state...
✅ Authenticated as:
   - User ID: 06368476-4193-46fe-acf1-bb4d1d246b36
   - Email: mshareef.nms@gmail.com

2️⃣ Checking user profile...
✅ Profile found:
   - Role: super_admin
   - Active: true
   - Is Staff: true

3️⃣ Testing is_staff() function...
✅ is_staff() returned: true

4️⃣ Attempting to fetch orders...
✅ Orders query SUCCESS! Returned 5 orders

5️⃣ Counting total orders...
✅ Total orders accessible: 62

✅ ===== DEBUG COMPLETE: ALL CHECKS PASSED =====
```

### Common Issues and Fixes:

#### ❌ Issue: "Profile query error: RLS blocking"
**Problem**: The `users` table RLS policy doesn't allow reading your own profile

**SQL Fix**:
```sql
-- Run this in Supabase SQL Editor
DROP POLICY IF EXISTS "users_select_own" ON users;

CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

#### ❌ Issue: "Orders query FAILED: row level security"
**Problem**: The `orders` table RLS policy doesn't recognize you as staff

**SQL Fix**:
```sql
-- First, verify is_staff() function exists and works
SELECT is_staff();
-- Should return TRUE if you're logged in as admin/super_admin

-- If it returns FALSE or errors, check the function:
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Fix the orders policy:
DROP POLICY IF EXISTS "orders_select" ON orders;

CREATE POLICY "orders_select"
  ON orders
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR customer_id = auth.uid()
    OR delivery_agent_id = auth.uid()
  );
```

#### ❌ Issue: "is_staff() function may not exist"
**Problem**: The helper function is missing

**SQL Fix**:
```sql
-- Create the is_staff() function
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
$$;
```

### Step 4: Verify in Dashboard

After fixing any issues:
1. Refresh the dashboard (`Ctrl+R` or `Cmd+R`)
2. Navigate to `/orders`
3. You should see all 62 orders loaded
4. Check console for success logs with `[Bolt]` prefix

### Manual SQL Verification

You can also test directly in Supabase SQL Editor:

```sql
-- This should return TRUE if you're logged in as staff
SELECT is_staff();

-- This should return your profile
SELECT * FROM users WHERE id = auth.uid();

-- This should return all orders (62 rows for admin)
SELECT count(*) FROM orders;
```

## Summary

The dashboard is now configured to:

1. ✅ Use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. ✅ Call `supabase.auth.getUser()` to verify session
3. ✅ Fetch profile from `users` table with proper logging
4. ✅ Display detailed error messages for RLS issues
5. ✅ Include comprehensive console logs prefixed with `[Bolt]`

All data fetching uses the **anon key** with RLS enforcement. No service_role key is used in the frontend.
