import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log(`[list-users] Request received: ${req.method} ${req.url}`);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[list-users] No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[list-users] Authorization header present');

    // Create Supabase client with service role for admin operations
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('[list-users] Auth error:', userError?.message || 'No user');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[list-users] Request by: ${user.id} (${user.email})`);

    console.log('Checking role for user:', user.id);

    // Check if user has SUPER_ADMIN role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error(`[list-users] Failed to fetch role for ${user.id}:`, roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (roleData?.role !== 'SUPER_ADMIN') {
      console.warn(`[list-users] Access denied for ${user.id} - Role: ${roleData?.role}`);
      return new Response(
        JSON.stringify({ error: 'Access denied. Only SUPER_ADMIN can list users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[list-users] Authorized - User ${user.id} is SUPER_ADMIN`);

    console.log('User has SUPER_ADMIN role, fetching users list');

    // Fetch all auth users using admin client
    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Failed to list users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return sanitized user data (no sensitive tokens)
    const sanitizedUsers = authUsers.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    console.log(`Successfully fetched ${sanitizedUsers.length} users`);

    return new Response(
      JSON.stringify({ users: sanitizedUsers }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in list-users:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
