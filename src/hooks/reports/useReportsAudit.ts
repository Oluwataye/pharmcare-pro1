import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
    eventTypes?: string[];
    status?: string;
    page?: number;
    pageSize?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    count: number;
}

export const useReportsAuditLogs = (filters: AuditLogFilters) => {
    return useQuery({
        queryKey: ['report-audit-logs', filters],
        queryFn: async () => {
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 50;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (filters.startDate) {
                query = query.gte('created_at', startOfDay(new Date(filters.startDate)).toISOString());
            }

            if (filters.endDate) {
                query = query.lte('created_at', endOfDay(new Date(filters.endDate)).toISOString());
            }

            if (filters.eventTypes && filters.eventTypes.length > 0 && filters.eventTypes[0] !== 'all') {
                query = query.in('event_type', filters.eventTypes);
            }

            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters.searchQuery) {
                const q = filters.searchQuery;
                query = query.ilike('action', `%${q}%`);
            }

            // Apply pagination range
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            // Note: Client-side refinement filter removed strictly for server-side pagination correctness.
            // If we need deep JSON search, we must use Postgres Text Search or RPC.
            // For now, simple ILIKE on action is the "Search" capable feature.

            return {
                data: (data || []) as any[],
                count: count || 0
            };
        },
        staleTime: 1000 * 30, // 30 seconds
    });
};
