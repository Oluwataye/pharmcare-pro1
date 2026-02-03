
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export interface ReportFilters {
    startDate: string;
    endDate: string;
    branchId?: string;
}

/**
 * Hook to fetch and cache sales data for reports.
 * Used by Sales Volume, P&L, and Audit reports to share a single cache.
 */
export const useReportsSales = ({ startDate, endDate, branchId }: ReportFilters) => {
    return useQuery({
        queryKey: ['report-sales', startDate, endDate, branchId],
        queryFn: async () => {
            let query = supabase
                .from('sales' as any)
                .select(`
          id,
          total,
          date,
          created_at,
          branch_id,
          payment_methods,
          customer_name,
          branches:branch_id(name),
          sales_items (
            quantity,
            cost_price,
            total
          )
        `)
                .gte('date', startDate)
                .lte('date', endDate);

            if (branchId && branchId !== 'all') {
                query = (query as any).eq('branch_id', branchId);
            }

            const { data, error } = await query.order('date', { ascending: true }) as any;
            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};

/**
 * Hook to fetch and cache expense data for reports.
 * Shared between P&L and Budgeting reports.
 */
export const useReportsExpenses = ({ startDate, endDate, branchId }: ReportFilters) => {
    return useQuery({
        queryKey: ['report-expenses', startDate, endDate, branchId],
        queryFn: async () => {
            let query = supabase
                .from('expenses' as any)
                .select('*, branches:branch_id(name)')
                .gte('date', startDate)
                .lte('date', endDate);

            if (branchId && branchId !== 'all') {
                query = (query as any).eq('branch_id', branchId);
            }

            const { data, error } = await query.order('date', { ascending: false }) as any;
            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 5,
    });
};

/**
 * Hook to fetch branches for filtering.
 */
export const useReportBranches = () => {
    return useQuery({
        queryKey: ['report-branches'],
        queryFn: async () => {
            const { data, error } = await supabase.from('branches' as any).select('*');
            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
