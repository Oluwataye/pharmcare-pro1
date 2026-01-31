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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Starting backup cleanup...');

        // 1. Fetch retention settings
        const { data: settings, error: settingsError } = await supabase
            .from('store_settings')
            .select('backup_retention_days')
            .single();

        if (settingsError) throw settingsError;
        const retentionDays = settings?.backup_retention_days ?? 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        console.log(`Cleaning up backups older than ${retentionDays} days (Cutoff: ${cutoffDate.toISOString()})`);

        // 2. List all files in backups bucket
        const { data: files, error: listError } = await supabase
            .storage
            .from('backups')
            .list('', { limit: 1000 });

        if (listError) throw listError;
        if (!files || files.length === 0) {
            return new Response(JSON.stringify({ success: true, message: 'No backup files found.', deletedCount: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // 3. Filter files for deletion
        // Daily backup filename format: daily_backup_2026-01-31T00-11-20-000Z.json
        const filesToDelete = files.filter(file => {
            if (file.name === '.emptyFolderPlaceholder') return false;

            // Attempt to parse date from filename or use created_at
            const match = file.name.match(/daily_backup_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json/);
            let fileDate: Date;

            if (match) {
                // Re-standardize the timestamp for parsing
                const standardizedDate = match[1].replace(/-/g, ':').replace(/T(\d{2}):(\d{2}):(\d{2}):/, 'T$1:$2:$3.');
                fileDate = new Date(standardizedDate);
            } else {
                fileDate = new Date(file.created_at);
            }

            return fileDate < cutoffDate;
        }).map(file => file.name);

        console.log(`Found ${filesToDelete.length} files to delete.`);

        // 4. Perform deletion
        if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .storage
                .from('backups')
                .remove(filesToDelete);

            if (deleteError) throw deleteError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Cleanup completed. Deleted ${filesToDelete.length} files.`,
                deletedCount: filesToDelete.length,
                retentionDays,
                cutoffDate: cutoffDate.toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Cleanup error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
