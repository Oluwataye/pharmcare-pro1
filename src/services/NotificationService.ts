import { supabase } from '@/integrations/supabase/client';

export interface AlertPayload {
    type: 'LOW_STOCK' | 'BACKUP_FAILURE' | 'SYSTEM_ALERT';
    message: string;
    data?: Record<string, any>;
}

export const NotificationService = {
    /**
     * Sends an alert via the backend Edge Function.
     * This is used when the frontend detects an issue (e.g., during optimistic UI updates or specific client-side checks).
     * Note: Critical alerts (like post-sale stock checks) should also be triggered by the backend to ensure reliability.
     */
    sendAlert: async (payload: AlertPayload) => {
        try {
            const { error } = await supabase.functions.invoke('send-alert', {
                body: payload,
            });

            if (error) {
                console.error('[NotificationService] Failed to send alert:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('[NotificationService] Error sending alert:', err);
            return false;
        }
    },

    /**
     * Updates notification settings in the database.
     */
    updateSettings: async (settings: {
        low_stock_threshold_global?: number;
        enable_low_stock_alerts?: boolean;
        enable_backup_alerts?: boolean;
    }) => {
        try {
            // Assuming store_settings has a single row with ID 1, or we update the first row found
            const { error } = await supabase
                .from('store_settings')
                .update(settings as any)
                .eq('id', 1); // Adjust if your store_settings uses a different ID strategy

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('[NotificationService] Failed to update settings:', err);
            throw err;
        }
    }
};
