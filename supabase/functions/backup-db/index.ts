
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or Service Role Key is missing in environment variables.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Automated backup request received.');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tables = ['inventory', 'inventory_batches', 'sales', 'sales_items', 'stock_movements', 'profiles', 'store_settings', 'suppliers', 'refunds'];
        const backupData: Record<string, any> = {};

        console.log(`Starting data fetch for ${tables.length} tables...`);

        for (const table of tables) {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Warning: Failed to fetch ${table}:`, error.message);
                backupData[table] = { error: error.message };
            } else {
                backupData[table] = data;
            }
        }

        backupData['meta'] = {
            version: '1.0',
            created_at: new Date().toISOString(),
            type: 'automated_daily_backup'
        };

        console.log('Fetch complete. Validating storage bucket...');

        // Ensure backups bucket exists (client-side check is limited, so we just try)
        const fileName = `daily_backup_${timestamp}.json`;

        console.log(`Uploading backup to bucket 'backups' as ${fileName}...`);

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('backups')
            .upload(fileName, JSON.stringify(backupData), {
                contentType: 'application/json',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            throw new Error(`Storage upload failed: ${uploadError.message}. Make sure the 'backups' bucket exists.`);
        }

        console.log('Backup successful:', uploadData.path);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Backup created successfully',
                file: fileName,
                path: uploadData.path
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('CRITICAL BACKUP FAILURE:', error.message)

        // Try to signal failure if possible
        try {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            await supabase.functions.invoke('send-alert', {
                body: {
                    type: 'BACKUP_FAILURE',
                    message: `System Alert: Automated database backup failed. Error: ${error.message}`,
                    data: {
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (alertError) {
            console.warn('Could not send alert notification:', alertError.message);
        }

        return new Response(
            JSON.stringify({
                error: error.message,
                details: 'Check Edge Function logs in Supabase dashboard for full stack trace.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
