import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GdprRequestBody {
  action: 'export' | 'delete' | 'access';
  userId?: string; // For admin processing
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token for auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: GdprRequestBody = await req.json();
    const { action, userId: targetUserId } = body;

    // Determine target user (self or admin processing)
    const targetUser = targetUserId || user.id;

    // Check if admin is processing another user's request
    if (targetUserId && targetUserId !== user.id) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'SUPER_ADMIN') {
        return new Response(
          JSON.stringify({ error: 'Only admins can process other users requests' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Processing GDPR ${action} request for user: ${targetUser}`);

    if (action === 'export' || action === 'access') {
      // Gather all user data
      const userData: Record<string, unknown> = {};

      // Get profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', targetUser)
        .single();
      userData.profile = profile;

      // Get user role
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', targetUser);
      userData.roles = roles;

      // Get sales made by user
      const { data: sales } = await supabaseAdmin
        .from('sales')
        .select('*, sales_items(*)')
        .eq('cashier_id', targetUser);
      userData.sales = sales;

      // Get print analytics
      const { data: printAnalytics } = await supabaseAdmin
        .from('print_analytics')
        .select('*')
        .eq('cashier_id', targetUser);
      userData.print_analytics = printAnalytics;

      // Get audit logs for user
      const { data: auditLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', targetUser)
        .order('created_at', { ascending: false })
        .limit(1000);
      userData.audit_logs = auditLogs;

      // Get GDPR requests
      const { data: gdprRequests } = await supabaseAdmin
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', targetUser);
      userData.gdpr_requests = gdprRequests;

      // Log the export
      await supabaseAdmin.rpc('log_audit_event', {
        p_event_type: 'DATA_EXPORTED',
        p_user_id: user.id,
        p_user_email: user.email,
        p_user_role: null,
        p_action: `GDPR data ${action} for user ${targetUser}`,
        p_resource_type: 'user_data',
        p_resource_id: targetUser,
        p_details: { target_user: targetUser },
        p_status: 'success',
        p_error_message: null,
        p_ip_address: null,
        p_user_agent: req.headers.get('user-agent'),
      });

      // Create GDPR request record
      await supabaseAdmin.from('gdpr_requests').insert({
        user_id: targetUser,
        request_type: action.toUpperCase(),
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: userData,
          exportedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Call the anonymize function
      const { error: anonymizeError } = await supabaseAdmin.rpc('anonymize_user_data', {
        p_user_id: targetUser,
      });

      if (anonymizeError) {
        console.error('Anonymization error:', anonymizeError);
        return new Response(
          JSON.stringify({ error: 'Failed to anonymize user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the deletion
      await supabaseAdmin.rpc('log_audit_event', {
        p_event_type: 'DATA_DELETED',
        p_user_id: user.id,
        p_user_email: user.email,
        p_user_role: null,
        p_action: `GDPR right to be forgotten exercised for user ${targetUser}`,
        p_resource_type: 'user_data',
        p_resource_id: targetUser,
        p_details: { target_user: targetUser, action: 'anonymization' },
        p_status: 'success',
        p_error_message: null,
        p_ip_address: null,
        p_user_agent: req.headers.get('user-agent'),
      });

      // Create GDPR request record
      await supabaseAdmin.from('gdpr_requests').insert({
        user_id: targetUser,
        request_type: 'DELETE',
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        notes: 'User data anonymized per GDPR right to be forgotten',
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User data has been anonymized',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GDPR request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
