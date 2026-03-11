import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, licenseKey, clientName, domain, installationId } = await req.json()

    // Setup Hashing function for installation ID
    const hashInstallationId = async (id: string, domainName: string) => {
      const data = new TextEncoder().encode(`${id}-${domainName}-pharmcare-salt-v1`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return encodeHex(hashBuffer);
    };

    if (action === 'activate') {
      if (!licenseKey || !clientName || !domain || !installationId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 1. Verify format PHARMCARE-XXXX-XXXX-XXXX
      const keyFormat = /^PHARMCARE(-[A-Z0-9]{4}){3}$/;
      if (!keyFormat.test(licenseKey)) {
        return new Response(
          JSON.stringify({ error: 'Invalid license key format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 2. Check if a license is already active
      const { data: existingLicenses, error: fetchError } = await supabaseClient
        .from('system_license')
        .select('*')
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (existingLicenses && existingLicenses.length > 0) {
        return new Response(
          JSON.stringify({ error: 'System is already licensed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 3. Hash the installation ID
      const hashedInstallationId = await hashInstallationId(installationId, domain);

      // 4. Insert the new license
      const { data: newLicense, error: insertError } = await supabaseClient
        .from('system_license')
        .insert([{
          license_key: licenseKey,
          client_name: clientName,
          domain: domain,
          installation_id: hashedInstallationId,
          status: 'active'
        }])
        .select()
        .single();

      if (insertError) {
        // Handle unique constraint violation gracefully
        if (insertError.code === '23505') {
            return new Response(
                JSON.stringify({ error: 'This license key has already been used.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, license: newLicense }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } 
    
    if (action === 'verify') {
      if (!licenseKey || !domain || !installationId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields for verification' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const hashedInstallationId = await hashInstallationId(installationId, domain);

      const { data: license, error } = await supabaseClient
        .from('system_license')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('status', 'active')
        .single();

      if (error || !license) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'License not found or inactive' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      if (license.domain !== domain || license.installation_id !== hashedInstallationId) {
         return new Response(
          JSON.stringify({ valid: false, reason: 'Installation footprint mismatch' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Update last_verified_at
      await supabaseClient
        .from('system_license')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('id', license.id);

      return new Response(
        JSON.stringify({ valid: true, clientName: license.client_name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'deactivate') {
        const { id } = await req.json();
        // Just checking basic permissions - in real app, verify admin JWT
        
        const { error } = await supabaseClient
            .from('system_license')
            .update({ status: 'revoked' })
            .eq('id', id);

        if (error) throw error;
        
        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('License Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
