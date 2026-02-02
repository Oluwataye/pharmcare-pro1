import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAutoBackup = () => {
    const { user, isAuthenticated } = useAuth();
    const hasChecked = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
            return;
        }

        if (hasChecked.current) return;
        hasChecked.current = true;

        const checkAndTriggerBackup = async () => {
            try {
                // Get store settings to check last backup at
                const { data, error: fetchError } = await supabase
                    .from('store_settings')
                    .select('id, last_backup_at, enable_auto_backups')
                    .limit(1) as { data: any[] | null, error: any };

                const settings = data && data.length > 0 ? data[0] : null;

                if (fetchError) {
                    // Silently fail if columns don't exist or schema is not ready (migration not applied yet)
                    const errorStatus = fetchError.status || (fetchError as any).statusCode;
                    const errorMsg = fetchError.message || "";

                    if (
                        errorStatus === 406 ||
                        errorMsg.includes('column') ||
                        fetchError.code === '42703' ||
                        errorMsg.includes('Not Acceptable') ||
                        fetchError.code === 'PGRST116'
                    ) {
                        console.log('[useAutoBackup] Schema mismatch or multiple settings rows, skipping backup check until schema is updated');
                        return;
                    }
                    throw fetchError;
                }

                if (!settings?.enable_auto_backups) {
                    console.log('[useAutoBackup] Automated backups are disabled');
                    return;
                }

                const lastBackup = settings.last_backup_at ? new Date(settings.last_backup_at) : null;
                const now = new Date();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                if (!lastBackup || (now.getTime() - lastBackup.getTime()) > twentyFourHours) {
                    console.log('[useAutoBackup] Starting automated backup...');

                    const { data, error } = await supabase.functions.invoke('backup-db');

                    if (error) throw error;

                    console.log('[useAutoBackup] Backup successful:', data.file);

                    // Update store settings with new last_backup_at
                    await supabase
                        .from('store_settings')
                        .update({
                            // @ts-ignore
                            last_backup_at: new Date().toISOString()
                        })
                        .eq('id', (settings as any).id);
                } else {
                    console.log('[useAutoBackup] Last backup was recent:', lastBackup.toLocaleString());
                }
            } catch (err: any) {
                // Suppress PostgREST multiple results error
                if (err?.code === 'PGRST116') {
                    console.log('[useAutoBackup] Multiple store settings found, using the first one');
                    return;
                }

                // Suppress CORS / Network / Function fetch errors (common in some browser environments or if function not deployed)
                if (err?.name === 'FunctionsFetchError' || err?.message?.toLowerCase().includes('failed to fetch')) {
                    console.log('[useAutoBackup] Edge Function connectivity issue (possibly CORS or not deployed), skipping check');
                    return;
                }

                console.error('[useAutoBackup] Error during automated backup check:', err);
                // Fail silently to prevent blocking the app
            }
        };

        checkAndTriggerBackup();
    }, [isAuthenticated, user]);
};
