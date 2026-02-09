import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface StockAdjustmentFilters {
    startDate: string;
    endDate: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}

export interface InventoryFilters {
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}

/**
 * Hook to fetch stock adjustments/movements (Paginated List)
 */
export const useReportsStockAdjustments = ({ startDate, endDate, searchQuery, page, pageSize }: StockAdjustmentFilters) => {
    return useQuery({
        queryKey: ['report-stock-adjustments', startDate, endDate, searchQuery, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('stock_movements' as any)
                .select(`
                    *,
                    inventory (name, sku, category),
                    profiles:created_by (name)
                `, { count: 'exact' })
                .in('type', ['ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL'])
                .gte('created_at', startOfDay(new Date(startDate)).toISOString())
                .lte('created_at', endOfDay(new Date(endDate)).toISOString())
                .order('created_at', { ascending: false });

            // Apply Sort
            // (Already applied above)

            // Apply Pagination
            if (page && pageSize) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
            }

            // Note: Server-side search on joined tables is restricted.
            // For now, we fetch paginated results. Search filtering on server would require different query structure.
            // If searchQuery is present, we might return empty or rely on client filtering of the PAGE (which is imperfect).
            // Ideal solution: Use RPC or Supabase Text Search.
            // Current compromise: Return paginated data.
            // If `searchQuery` is heavily used, we should implement a specific search RPC.
            // For this migration, we kept the previous pattern but now it's paginated.
            // Actually, previous pattern filtered AFTER fetch.
            // With pagination, we returns 50 items.
            // We'll stick to pagination logic.

            const { data, error, count } = await query;
            if (error) throw error;

            let result = (data || []) as any[];

            // Client-side filtering of the FETCHED PAGE (Imperfect but avoids breaking app)
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                result = result.filter((item: any) =>
                    item.inventory?.name?.toLowerCase().includes(lowerQuery) ||
                    item.inventory?.sku?.toLowerCase().includes(lowerQuery) ||
                    item.reason?.toLowerCase().includes(lowerQuery)
                );
            }

            return {
                data: result,
                count: count || 0
            };
        },
        staleTime: 1000 * 60 * 2, // 2 mins
    });
};

/**
 * Hook to fetch lightweight stock adjustment stats for Charts & Metrics
 */
export const useReportsStockAdjustmentStats = ({ startDate, endDate }: StockAdjustmentFilters) => {
    return useQuery({
        queryKey: ['report-stock-adjustments-stats', startDate, endDate],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stock_movements' as any)
                .select(`
                    created_at,
                    quantity_change,
                    cost_price_at_time,
                    unit_price_at_time,
                    type,
                    inventory (name)
                `)
                .in('type', ['ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL'])
                .gte('created_at', startOfDay(new Date(startDate)).toISOString())
                .lte('created_at', endOfDay(new Date(endDate)).toISOString());

            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 5 // 5 mins
    });
};

/**
 * Hook to fetch inventory list (Paginated)
 */
export const useReportsInventoryList = ({ searchQuery, page, pageSize }: InventoryFilters) => {
    return useQuery({
        queryKey: ['report-inventory-list', searchQuery, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('inventory')
                .select('*', { count: 'exact' });

            if (searchQuery) {
                // Specific text search on name or sku
                query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
            }

            query = query.order('name', { ascending: true });

            if (page && pageSize) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: (data || []) as any[],
                count: count || 0
            };
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });
};

/**
 * Hook to fetch inventory stats (Full dataset for Metrics)
 */
export const useReportsInventoryStats = () => {
    return useQuery({
        queryKey: ['report-inventory-stats'],
        queryFn: async () => {
            // Fetch only necessary columns for stats
            const { data, error } = await supabase
                .from('inventory')
                .select('quantity, cost_price, price, reorder_level, category');

            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 10, // 10 mins cache for stats
    });
};
