import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface StockAdjustmentFilters {
    startDate: string;
    endDate: string;
    searchQuery?: string;
}

/**
 * Hook to fetch stock adjustments/movements
 */
export const useReportsStockAdjustments = ({ startDate, endDate, searchQuery }: StockAdjustmentFilters) => {
    return useQuery({
        queryKey: ['report-stock-adjustments', startDate, endDate, searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('stock_movements' as any)
                .select(`
                    *,
                    inventory (name, sku, category),
                    profiles:created_by (name)
                `)
                .in('type', ['ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL'])
                .gte('created_at', startOfDay(new Date(startDate)).toISOString())
                .lte('created_at', endOfDay(new Date(endDate)).toISOString())
                .order('created_at', { ascending: false });

            // Note: server-side search on joined tables is tricky in simple Supabase queries without complex filters or RPC.
            // We will filter search on client side for now as we did in the original component, 
            // but if we wanted server side:
            // if (searchQuery) {
            //      query = query.textSearch('inventory.name', searchQuery) ... 
            // }

            const { data, error } = await query;
            if (error) throw error;

            // Client-side filtering for search query if provided
            let result = data || [];
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                result = result.filter((item: any) =>
                    item.inventory?.name?.toLowerCase().includes(lowerQuery) ||
                    item.inventory?.sku?.toLowerCase().includes(lowerQuery) ||
                    item.reason?.toLowerCase().includes(lowerQuery)
                );
            }

            return result as any[];
        },
        staleTime: 1000 * 60 * 2, // 2 mins
    });
};

/**
 * Hook to fetch current inventory for valuation report
 */
export const useReportsInventoryValuation = () => {
    return useQuery({
        queryKey: ['report-inventory-valuation'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });
};
