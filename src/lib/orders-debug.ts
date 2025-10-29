import { supabase } from './supabase';

/**
 * Debug utility to test orders RLS and staff authentication
 * This helps identify RLS policy issues
 */
export async function debugOrdersAccess() {
  console.log('\n🔍 ===== ORDERS RLS DEBUG REPORT =====\n');

  // 1. Check Auth State
  console.log('1️⃣ Checking auth state...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('❌ Auth error:', authError);
    return { success: false, error: 'Auth failed' };
  }

  if (!user) {
    console.error('❌ No authenticated user');
    return { success: false, error: 'Not logged in' };
  }

  console.log('✅ Authenticated as:');
  console.log('   - User ID:', user.id);
  console.log('   - Email:', user.email);

  // 2. Check User Profile
  console.log('\n2️⃣ Checking user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Profile query error:', profileError);
    return { success: false, error: 'Cannot read user profile - RLS blocking?' };
  }

  if (!profile) {
    console.error('❌ No profile found for user:', user.id);
    return { success: false, error: 'Profile not found' };
  }

  console.log('✅ Profile found:');
  console.log('   - Role:', profile.role);
  console.log('   - Active:', profile.is_active);
  console.log('   - Is Staff:', ['admin', 'super_admin'].includes(profile.role));

  // 3. Test is_staff() function via SQL
  console.log('\n3️⃣ Testing is_staff() function...');
  try {
    const { data: staffCheck, error: staffError } = await supabase.rpc('is_staff');

    if (staffError) {
      console.error('❌ is_staff() error:', staffError);
    } else {
      console.log('✅ is_staff() returned:', staffCheck);
    }
  } catch (err) {
    console.warn('⚠️  is_staff() function may not exist:', err);
  }

  // 4. Try to fetch orders
  console.log('\n4️⃣ Attempting to fetch orders...');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, customer_id, created_at')
    .limit(5);

  if (ordersError) {
    console.error('❌ Orders query FAILED:', ordersError);
    console.error('   - Code:', ordersError.code);
    console.error('   - Message:', ordersError.message);
    console.error('   - Details:', ordersError.details);
    console.error('   - Hint:', ordersError.hint);

    return {
      success: false,
      error: 'RLS policy blocking orders SELECT',
      details: ordersError
    };
  }

  console.log(`✅ Orders query SUCCESS! Returned ${orders?.length || 0} orders`);

  // 5. Count total orders
  console.log('\n5️⃣ Counting total orders...');
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Count error:', countError);
  } else {
    console.log(`✅ Total orders accessible: ${count}`);
  }

  console.log('\n✅ ===== DEBUG COMPLETE: ALL CHECKS PASSED =====\n');

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email
    },
    profile: {
      role: profile.role,
      is_active: profile.is_active
    },
    ordersCount: count || 0,
    sampleOrders: orders
  };
}
