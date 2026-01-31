import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        const { type, message, data } = await req.json();

        // Supabase Client to check settings
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Check if alerts are enabled for this type
        const { data: settings, error: settingsError } = await supabase
            .from('store_settings')
            .select('*')
            .single();

        if (settingsError) {
            console.error('Failed to fetch settings:', settingsError);
            // Fallback: Proceed if critical, strictly generic error handling
        }

        const shouldSend = (() => {
            if (!settings) return true; // Default to true if no settings found (safety)
            if (type === 'LOW_STOCK') return settings.enable_low_stock_alerts;
            if (type === 'BACKUP_FAILURE') return settings.enable_backup_alerts;
            return true; // System alerts always go through
        })();

        if (!shouldSend) {
            return new Response(
                JSON.stringify({ success: false, message: 'Alerts disabled for this type' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 2. Prepare OneSignal Request
        const appId = Deno.env.get('ONESIGNAL_APP_ID');
        const apiKey = Deno.env.get('ONESIGNAL_API_KEY');

        if (!appId || !apiKey) {
            console.warn('OneSignal credentials missing. Logging alert instead.');
            console.log(`[ALERT - ${type}] ${message}`, data);
            return new Response(
                JSON.stringify({ success: true, message: 'Logged to console (credentials missing)' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const notificationBody = {
            app_id: appId,
            included_segments: ["Admin"], // Assumes you have a segment for Admins
            contents: { en: message },
            headings: { en: `System Alert: ${type.replace('_', ' ')}` },
            data: { type, ...data },
            small_icon: "ic_stat_onesignal_default"
        };

        // 3. Send to OneSignal
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${apiKey}`
            },
            body: JSON.stringify(notificationBody)
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(`OneSignal Error: ${JSON.stringify(result.errors)}`);
        }

        return new Response(
            JSON.stringify({ success: true, original_response: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Alert Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
