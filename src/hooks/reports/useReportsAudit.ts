import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
    eventTypes?: string[]; // e.g., ['LOGIN_SUCCESS', 'SALE_COMPLETED']
    status?: string; // 'success' | 'failed' | 'all'
    limit?: number;
}

export const useReportsAuditLogs = (filters: AuditLogFilters) => {
    return useQuery({
        queryKey: ['report-audit-logs', filters],
        queryFn: async () => {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.startDate) {
                query = query.gte('created_at', startOfDay(new Date(filters.startDate)).toISOString());
            }

            if (filters.endDate) {
                query = query.lte('created_at', endOfDay(new Date(filters.endDate)).toISOString());
            }

            if (filters.eventTypes && filters.eventTypes.length > 0 && filters.eventTypes[0] !== 'all') {
                // If filtering by specific transaction types (like in TransactionAuditLog)
                // or general event types
                query = query.in('event_type', filters.eventTypes);
            }

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            } else {
                query = query.limit(100); // Default limit safety
            }

            if (filters.searchQuery) {
                const q = filters.searchQuery;
                // Simple ILIKE search (Supabase doesn't support complex OR easily without RPC or specific text search config)
                // We'll try to filter by main text fields. 
                // Note: deeply nested JSON filtering is hard in standardized query. 
                // We will rely on primary columns for now or client side refine if needed.
                // For now, let's filter by action matching
                query = query.ilike('action', `%${q}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Client-side refinement for broader search if needed (e.g. searching user_email which is a column)
            let result = data || [];

            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                result = result.filter(log =>
                    log.action.toLowerCase().includes(q) ||
                    log.user_email?.toLowerCase().includes(q) ||
                    (typeof log.details === 'string' && log.details.toLowerCase().includes(q))
                );
            }

            return result as any[];
        },
        staleTime: 1000 * 30, // 30 seconds
    });
};
