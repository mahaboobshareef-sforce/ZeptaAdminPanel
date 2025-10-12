# Role-Based Access Control (RBAC) Setup Guide

## Overview

The application now has a complete role-based access control system with two admin roles:
- **Super Admin**: Full access to all features
- **Admin**: Restricted access (cannot access financial and sensitive features)

## Access Control Matrix

| Feature | Super Admin | Admin |
|---------|-------------|-------|
| Dashboard | ✅ | ✅ |
| Orders | ✅ | ✅ |
| Products | ✅ | ✅ |
| Inventory | ✅ | ✅ |
| Bulk Inventory | ✅ | ✅ |
| **Purchase Management** | ✅ | ❌ |
| **Inventory Adjustments** | ✅ | ❌ |
| Delivery Agents | ✅ | ✅ |
| Stores | ✅ | ✅ |
| Categories | ✅ | ✅ |
| Coupons | ✅ | ✅ |
| Banners | ✅ | ✅ |
| **Payments** | ✅ | ❌ |
| **Refunds** | ✅ | ❌ |
| Ratings | ✅ | ✅ |
| Support Tickets | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Analytics | ✅ | ✅ |
| **Profit Analysis** | ✅ | ❌ |
| Settings | ✅ | ✅ |

## How to Promote a User to Super Admin

### Step 1: Identify the User
First, find the user ID you want to promote:

```sql
SELECT id, email, full_name, role
FROM users
WHERE email = 'admin@example.com';
```

### Step 2: Promote to Super Admin
Update the user's role to `super_admin`:

```sql
UPDATE users
SET role = 'super_admin'
WHERE email = 'admin@example.com';
```

Or by user ID:

```sql
UPDATE users
SET role = 'super_admin'
WHERE id = 'USER_ID_HERE';
```

### Step 3: Verify the Change
Check that the role was updated:

```sql
SELECT id, email, full_name, role
FROM users
WHERE email = 'admin@example.com';
```

## How to Create a Regular Admin

When creating a new admin user, simply ensure their role is set to `admin` (not `super_admin`):

```sql
-- Regular admins are created with role = 'admin'
-- They automatically have restricted access
```

## Security Layers

The system implements multiple layers of security:

1. **UI Layer**: Menu items are hidden based on permissions
2. **Route Layer**: Protected routes show "Access Denied" for unauthorized access
3. **Component Layer**: Components check permissions and return null if unauthorized
4. **Database Layer**: Row Level Security (RLS) policies block unauthorized queries

## What Happens When Admin Tries to Access Restricted Features?

### Scenario 1: Admin clicks on restricted link (hidden in sidebar)
- Admin won't see the link in the sidebar at all

### Scenario 2: Admin types restricted URL manually
- ProtectedRoute component shows "Access Denied" page
- User cannot access the feature

### Scenario 3: Admin bypasses frontend somehow
- Component-level check returns null
- Page won't render

### Scenario 4: Admin calls API directly
- Database RLS policies block the query
- Returns permission denied error

## Testing the Implementation

### Test as Super Admin:
1. Login with super admin account
2. Verify you see all 20 menu items in sidebar
3. Visit `/purchase-management` - should work
4. Visit `/payments` - should work
5. Visit `/refunds` - should work
6. Visit `/inventory-adjustments` - should work
7. Visit `/profit-analysis` - should work

### Test as Regular Admin:
1. Login with regular admin account
2. Verify you see only 15 menu items (5 items hidden)
3. Try to manually visit `/purchase-management` - should see "Access Denied"
4. Try to manually visit `/payments` - should see "Access Denied"
5. Try to manually visit `/refunds` - should see "Access Denied"
6. Try to manually visit `/inventory-adjustments` - should see "Access Denied"
7. Try to manually visit `/profit-analysis` - should see "Access Denied"

## Permission System

Permissions are defined in `src/config/permissions.ts`:

```typescript
export type Permission =
  | 'view_dashboard'
  | 'manage_orders'
  | 'purchase_management'  // Super Admin only
  | 'inventory_adjustments' // Super Admin only
  | 'view_payments'         // Super Admin only
  | 'manage_refunds'        // Super Admin only
  | 'view_profit_analysis'  // Super Admin only
  // ... more permissions
```

## How to Add New Permissions

1. Add new permission to `Permission` type in `src/config/permissions.ts`
2. Add permission to appropriate role in `ROLE_PERMISSIONS` object
3. Add permission check to navigation item in `src/components/Layout/Sidebar.tsx`
4. Wrap route with `ProtectedRoute` in `src/App.tsx`
5. Add permission check in component using `usePermissions()` hook

## Files Modified

- `supabase/migrations/add_super_admin_role.sql` - Database migration
- `supabase/migrations/add_rls_policies_for_super_admin.sql` - RLS policies
- `src/types/database.ts` - Added super_admin role type
- `src/config/permissions.ts` - Permission configuration (NEW)
- `src/hooks/usePermissions.ts` - Permission checking hook (NEW)
- `src/components/ProtectedRoute.tsx` - Route guard component (NEW)
- `src/components/Layout/Sidebar.tsx` - Filtered navigation
- `src/App.tsx` - Protected routes
- `src/pages/PurchaseManagement.tsx` - Permission check
- `src/pages/InventoryAdjustments.tsx` - Permission check
- `src/pages/Payments.tsx` - Permission check
- `src/pages/Refunds.tsx` - Permission check
- `src/pages/ProfitAnalysis.tsx` - Permission check

## Rollback Instructions

If you need to rollback the changes:

1. Remove RLS policies from restricted tables
2. Update all `super_admin` users back to `admin`
3. Remove permission checks from components
4. Remove `ProtectedRoute` wrappers from routes
5. Restore original Sidebar navigation

## Support

For issues or questions about the RBAC system, check:
- Database RLS policies in Supabase dashboard
- User roles in `users` table
- Browser console for permission errors
- Network tab for API permission errors
