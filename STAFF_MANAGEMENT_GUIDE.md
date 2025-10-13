# Staff Management Guide

## Overview

This guide explains how staff user creation works in the Zepta Admin system, including roles, authentication flow, and best practices.

## Role Hierarchy

```
super_admin (System Administrator)
  └── admin (Store Managers, Department Heads)
      └── staff (Delivery Agents, Store Staff, Support Staff)
          └── customer (Default for app sign-ups)
```

### Role Permissions

- **super_admin**: Full system access, can manage all data and users
- **admin**: Can manage stores, products, orders, and create staff
- **staff**: Limited access based on role type (e.g., delivery agents can only see assigned orders)
- **customer**: App users, can place orders and view their data

## How Staff Creation Works

### 1. **Auth Trigger (Automatic)**

When any user is created in Supabase Auth, a trigger automatically creates a record in the `users` table:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
```

The trigger:
- Reads `role` from `user_metadata` (defaults to 'customer')
- Creates user record with full_name, email, and role
- Sets `is_active = true`

### 2. **Edge Function (Invitation Flow)**

File: `supabase/functions/create-delivery-agent/index.ts`

**Flow:**
1. Admin enters staff details (name, email, mobile)
2. System generates secure random password
3. Creates auth user with `role: 'delivery_agent'` in user_metadata
4. Trigger creates user record automatically
5. Updates mobile_number and store_id
6. Sends magic link invitation email
7. Staff clicks link → sets their password

**Key Code:**
```typescript
// Create auth user with role in metadata
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
  user_metadata: {
    full_name,
    role: 'delivery_agent',  // ← Trigger reads this
  },
});

// Send invitation email
await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email,
});
```

## Creating Different Staff Types

### Delivery Agents
- **Role**: `delivery_agent`
- **Created by**: Admin via Delivery Agents page
- **Function**: `create-delivery-agent`
- **Fields**: name, email, mobile, store

### Store Managers (Admin)
- **Role**: `admin`
- **Created by**: Super Admin only
- **Method**: Direct SQL or create similar edge function
- **Fields**: name, email, mobile, assigned_stores

### Support Staff
- **Role**: `staff`
- **Created by**: Admin or Super Admin
- **Method**: Create similar edge function
- **Fields**: name, email, mobile, department

## Email Invitation Flow

### What Happens

1. **Staff receives email** with subject: "Welcome to Zepta Admin"
2. **Click magic link** → redirects to password setup page
3. **Sets new password** (minimum 8 characters)
4. **First login** → redirected to dashboard

### Email Customization

To customize invitation emails, update Supabase email templates:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Edit "Magic Link" template
3. Customize subject, body, and design

## Mobile Verification (Optional)

Currently not implemented, but recommended approach:

### Option A: SMS OTP (Recommended)
```typescript
// In edge function, after user creation
await sendSMSOTP(mobile_number, otp);

// Store OTP in database
await supabaseAdmin.from('user_verification').insert({
  user_id: userId,
  otp,
  expires_at: new Date(Date.now() + 10 * 60 * 1000)
});
```

### Option B: Phone Provider (Twilio/AWS SNS)
1. Integrate phone provider
2. Send verification code on first login
3. Verify before allowing access

## Best Practices

### Security

1. **Never hardcode passwords** - Always generate random secure passwords
2. **Force password change** - Require new password on first login
3. **Email verification** - Always verify email before account access
4. **Role validation** - Verify user has correct role before operations
5. **Audit logging** - Log all staff creation/modification events

### User Experience

1. **Clear invitation emails** with instructions
2. **Simple password reset** if they lose credentials
3. **Mobile verification** for delivery agents (high priority)
4. **Welcome message** on first login
5. **Role-based dashboards** - Show relevant features only

### Development

1. **Reusable edge functions** - Create generic staff creation function
2. **Consistent error handling** - User-friendly error messages
3. **Transaction safety** - Rollback on failures
4. **Duplicate prevention** - Check email/mobile before creation
5. **Soft delete** - Don't permanently delete users

## Creating New Staff Types

To add a new staff role (e.g., "store_manager"):

### Step 1: Update Role Enum
```sql
-- Add to user_role enum if needed
ALTER TYPE user_role ADD VALUE 'store_manager';
```

### Step 2: Create Edge Function
```bash
# Copy existing function
cp -r supabase/functions/create-delivery-agent supabase/functions/create-staff
```

### Step 3: Modify Function
```typescript
// Change role in metadata
user_metadata: {
  full_name,
  role: 'store_manager',  // ← New role
}
```

### Step 4: Update Permissions
```typescript
// In src/config/permissions.ts
export const rolePermissions = {
  store_manager: [
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'view_orders',
  ],
};
```

### Step 5: Create UI Page
- Add page like DeliveryAgents.tsx
- Call new edge function
- Show role-specific fields

## Troubleshooting

### Issue: Duplicate Key Error
**Cause**: User already exists in users table
**Solution**: Check if email exists before creating

### Issue: RLS Policy Blocks Creation
**Cause**: Admin doesn't have permission to insert into users
**Solution**: Update RLS policy to allow admin inserts

### Issue: Invitation Email Not Sent
**Cause**: Email service not configured or rate limited
**Solution**: Check Supabase email settings and quota

### Issue: User Can't Login After Creation
**Cause**: Password not set or email not confirmed
**Solution**: Send password reset link manually

## Production Checklist

- [ ] Custom email templates configured
- [ ] SMS provider integrated for mobile verification
- [ ] Audit logging enabled for staff operations
- [ ] Role-based access control tested
- [ ] Password policies enforced (min length, complexity)
- [ ] Rate limiting on staff creation endpoint
- [ ] Email deliverability tested
- [ ] Backup admin accounts created
- [ ] Documentation provided to admins
- [ ] Emergency access procedures defined

## Summary

**Minimal Effort Setup (Current):**
- ✅ Automatic user record creation via trigger
- ✅ Email invitation with magic link
- ✅ Role-based access control
- ❌ Mobile verification (add later)
- ❌ Custom email templates (use default)

**Production-Ready Setup:**
- ✅ Everything above
- ✅ SMS verification for delivery agents
- ✅ Custom branded email templates
- ✅ Audit logging for compliance
- ✅ Multi-factor authentication option

This approach balances simplicity with security and provides a foundation for growth.
