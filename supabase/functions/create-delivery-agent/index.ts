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

    if (!full_name || !email || !mobile_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    const tempPassword = `Agent${Math.random().toString(36).slice(-8)}@${Date.now().toString(36)}`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'delivery_agent',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create delivery agent: ' + (authError.message || 'Unknown error'),
          details: authError
        }),
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

    let userInserted = false;
    let insertError = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!userInserted && attempts < maxAttempts) {
      attempts++;

      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, attempts * 200));
      }

      const { error } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email,
          full_name,
          mobile_number,
          role: 'delivery_agent',
          store_id: store_id || null,
          is_active: true,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (!error) {
        userInserted = true;
      } else {
        insertError = error;
        console.error(`User insert error (attempt ${attempts}):`, JSON.stringify(error, null, 2));
      }
    }

    if (!userInserted && insertError) {
      return new Response(
        JSON.stringify({
          error: 'Database error creating new user',
          details: insertError.message || 'Unknown database error',
          code: insertError.code || 'UNKNOWN',
          hint: insertError.hint || 'No hint available',
          fullError: JSON.stringify(insertError)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`,
      },
    });

    if (resetError) {
      console.error('Failed to send invitation email:', resetError);
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return new Response(
      JSON.stringify({
        data: userData,
        message: 'Delivery agent created successfully. Invitation email sent.',
      }),
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