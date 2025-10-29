# Admin Dashboard - Quick Start Guide

## ⚡ TL;DR

Your Zepta Admin Dashboard is **ready to use** with proper Supabase authentication and RLS.

---

## 🚀 Quick Start

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser**: `http://localhost:5173`

3. **Login credentials**:
   - Email: `mshareef.nms@gmail.com` (or any admin user)
   - Password: (your password)

4. **Open console** (F12) to see debug logs

---

## ✅ What Works Now

- ✅ **Authentication** - Proper Supabase auth with `getUser()`
- ✅ **RLS Integration** - Uses `is_staff()` function
- ✅ **Orders Loading** - Should show all 62 orders for admins
- ✅ **Comprehensive Logging** - All logs prefixed with `[Bolt]`
- ✅ **Error Handling** - Clear RLS error messages
- ✅ **Environment Variables** - Correct Supabase URL and anon key

---

## 🧪 Quick Test

### In Browser Console:

```javascript
// Test 1: Check auth
const { data } = await supabase.auth.getUser();
console.log('User ID:', data.user?.id);
console.log('Email:', data.user?.email);

// Test 2: Check profile
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', data.user.id)
  .single();
console.log('Role:', profile.role);

// Test 3: Check orders access
const { data: orders, error } = await supabase
  .from('orders')
  .select('id')
  .limit(5);
console.log('Orders:', orders?.length, 'Error:', error);

// Test 4: Run comprehensive debug
import('/src/lib/orders-debug.ts').then(m => m.debugOrdersAccess());
```

---

## 📊 Expected Console Output

### On Login:
```
🔐 [Bolt] Attempting sign in...
📧 Email: mshareef.nms@gmail.com
✅ Sign in successful!
👤 User ID: 06368476-4193-46fe-acf1-bb4d1d246b36
```

### On Dashboard Load:
```
🔐 [Bolt Dashboard] Initializing auth...
👤 Bolt user id: 06368476-4193-46fe-acf1-bb4d1d246b36
📧 Bolt user email: mshareef.nms@gmail.com
✅ Profile loaded successfully!
   - Role: super_admin
   - Active: true
```

### On Orders Page:
```
🔄 [Bolt Orders] Loading orders...
👤 [Bolt Orders] Logged in as: 06368476... mshareef.nms@gmail.com
📦 [Bolt] fetchOrders: Starting...
✅ [Bolt] fetchOrders: Loaded 62 orders
```

---

## 🚨 If Something Doesn't Work

### Step 1: Run Debug Utility
```javascript
// In browser console
import('/src/lib/orders-debug.ts').then(module => {
  module.debugOrdersAccess();
});
```

### Step 2: Check Which Step Fails

| Step | What It Tests | If It Fails |
|------|---------------|-------------|
| 1️⃣ Auth state | Are you logged in? | Re-login |
| 2️⃣ Profile | Can you read users table? | Check users RLS |
| 3️⃣ is_staff() | Does function work? | Check function exists |
| 4️⃣ Orders query | Can you read orders? | Check orders RLS |
| 5️⃣ Count | How many visible? | Verify is_staff() returns true |

### Step 3: Common Fixes

**Fix 1: is_staff() Missing**
```sql
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
$$;
```

**Fix 2: Orders RLS Policy**
```sql
-- Run in Supabase SQL Editor
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

**Fix 3: Users RLS Policy**
```sql
-- Run in Supabase SQL Editor
DROP POLICY IF EXISTS "users_select_own" ON users;

CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Supabase URL and anon key |
| `src/lib/supabase.ts` | Supabase client + fetchOrders |
| `src/hooks/useAuth.ts` | Authentication hook |
| `src/lib/orders-debug.ts` | Debug utility (NEW) |
| `src/pages/Orders.tsx` | Orders page with enhanced logging |
| `ADMIN_DASHBOARD_FIXED.md` | Complete documentation |
| `RLS_DEBUG_TEST.md` | Step-by-step testing guide |

---

## 🎯 Success Checklist

When everything works, you should see:

- ✅ Login succeeds
- ✅ Dashboard loads with stats
- ✅ Orders page shows 62 orders
- ✅ Order details load (customer, items, payment)
- ✅ Console shows `[Bolt]` logs
- ✅ No RLS errors

---

## 💡 Pro Tips

1. **Always check console logs first** - They show exactly what's happening
2. **Use the debug utility** - Saves time troubleshooting
3. **Test in SQL Editor** - Verify RLS directly in Supabase
4. **Keep `.env` secure** - Never commit to git
5. **Service role key stays server-side** - Frontend uses anon key only

---

## 🆘 Still Stuck?

1. Check `ADMIN_DASHBOARD_FIXED.md` for detailed explanations
2. Run `debugOrdersAccess()` in console
3. Look for `[Bolt]` logs in console
4. Verify your user role in Supabase dashboard
5. Test SQL queries directly in Supabase SQL Editor

---

**Status**: ✅ Ready to use
**Database**: `https://aigtxqdeasdjeeeasgue.supabase.co`
**Auth Method**: Email/password via Supabase Auth
**RLS**: Enforced via `is_staff()` function
