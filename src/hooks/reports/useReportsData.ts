
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export interface ReportFilters {
    startDate: string;
    endDate: string;
    branchId?: string;
    page?: number;
    pageSize?: number;
}

/**
 * Hook to fetch and cache sales data for invoices/list view.
 * Supports Pagination.
 */
export const useReportsSales = ({ startDate, endDate, branchId, page, pageSize }: ReportFilters) => {
    return useQuery({
        queryKey: ['report-sales', startDate, endDate, branchId, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('sales' as any)
                .select(`
          id,
          total,
          discount,
          manual_discount,
          date:created_at,
          created_at,
          branch_id,
          payment_methods,
          customer_name,
          cashier_id,
          profiles:cashier_id(name),
          branches:branch_id(name),
          sales_items (
            quantity,
            price,
            cost_price,
            total,
            discount
          )
        `, { count: 'exact' });

            query = query.gte('created_at', startDate).lte('created_at', endDate);

            if (branchId && branchId !== 'all') {
                query = (query as any).eq('branch_id', branchId);
            }

            // Apply sorting
            query = query.order('created_at', { ascending: false });

            // Apply Pagination if provided
            if (page && pageSize) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
            }

            const { data, error, count } = await query as any;
            if (error) throw error;

            return {
                data: (data || []) as any[],
                count: count || 0
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};

/**
 * Hook to fetch lightweight sales stats for Charts and Metrics.
 * Fetches ALL records in range but only necessary columns.
 */
export const useReportsSalesStats = ({ startDate, endDate, branchId }: ReportFilters) => {
    return useQuery({
        queryKey: ['report-sales-stats', startDate, endDate, branchId],
        queryFn: async () => {
            let query = supabase
                .from('sales' as any)
                .select(`
                  id,
                  total,
                  date:created_at,
                  payment_methods,
                  branch_id
                `);

            query = query.gte('created_at', startDate).lte('created_at', endDate);

            if (branchId && branchId !== 'all') {
                query = (query as any).eq('branch_id', branchId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });
}

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
