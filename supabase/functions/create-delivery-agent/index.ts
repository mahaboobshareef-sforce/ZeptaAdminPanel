import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { full_name, email, mobile_number, store_id } = await req.json();

    // Validate required fields
    if (!full_name || !email || !mobile_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already exists in public.users (use maybeSingle to avoid error if not found)
    const { data: existingPublicUser } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    if (existingPublicUser) {
      return new Response(
        JSON.stringify({ 
          error: `A user with email ${email} already exists with role: ${existingPublicUser.role}` 
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser?.users?.find(u => u.email === email);

    if (authUserExists) {
      return new Response(
        JSON.stringify({ 
          error: `An auth user with email ${email} already exists but is not in the users table. Please contact support.` 
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'DeliveryAgent@123',
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'delivery_agent',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message || 'Failed to create auth user' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user - no user ID returned' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create user record in public.users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        mobile_number,
        role: 'delivery_agent',
        store_id: store_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Try to clean up auth user if user record creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      return new Response(
        JSON.stringify({ error: userError.message || 'Failed to create user record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ data: userData }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});