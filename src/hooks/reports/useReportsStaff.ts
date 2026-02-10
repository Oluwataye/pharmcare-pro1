import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { useReportsSales } from "./useReportsData";
import { useMemo } from "react";

export interface StaffPerformanceFilters {
    startDate: string;
    endDate: string;
    branchId?: string;
}

/**
 * Hook to fetch staff shifts
 */
export const useReportsShifts = ({ startDate, endDate, branchId }: StaffPerformanceFilters) => {
    return useQuery({
        queryKey: ['report-shifts', startDate, endDate, branchId],
        queryFn: async () => {
            let query = supabase
                .from('staff_shifts' as any)
                .select('*')
                .gte('created_at', startOfDay(new Date(startDate)).toISOString())
                .lte('created_at', endOfDay(new Date(endDate)).toISOString())
                .eq('status', 'closed'); // Only closed shifts have variance data

            // Note: staff_shifts table might not have branch_id in all versions of schema, 
            // but we assume it might be relevant. If not, we ignore branch filter for shifts 
            // or assume shifts are global/filtered by user assignment.
            // Checking previous code: it didn't filter shifts by branch. 
            // We will leave branch filter out for shifts unless schema confirms it exists.

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as any[];
        },
        staleTime: 1000 * 60 * 5,
    });
};

/**
 * Hook to calculate staff performance metrics
 * Combines Sales and Shifts data
 */
export const useReportsStaffPerformance = (filters: StaffPerformanceFilters) => {
    const { data: salesData, isLoading: loadingSales } = useReportsSales(filters);
    const { data: shifts = [], isLoading: loadingShifts } = useReportsShifts(filters);

    const performanceData = useMemo(() => {
        if (loadingSales || loadingShifts || !salesData?.data) return [];

        const stats: Record<string, any> = {};
        const sales = salesData.data;

        // 1. Process Sales
        sales.forEach(sale => {
            // Use created_by (profile id) if cashier_id not available, or reliable source
            // The sale object from useReportsSales has created_by and profiles joined
            const id = sale.created_by || 'unknown';
            const name = sale.profiles?.name || 'Unknown Staff'; // useReportsSales joins profiles:created_by(name)

            if (!stats[id]) {
                stats[id] = {
                    id,
                    name,
                    totalSales: 0,
                    transactionCount: 0,
                    variances: [],
                    shiftsCount: 0,
                    expectedCash: 0,
                    actualCash: 0
                };
            }
            stats[id].totalSales += Number(sale.total);
            stats[id].transactionCount += 1;
        });

        // 2. Process Shifts (Variance)
        shifts.forEach(shift => {
            const id = shift.staff_id;
            // Name fallback from shift if not found in sales (though unlikely if they have sales)
            const name = shift.staff_name || 'Unknown Staff';

            if (!stats[id]) {
                stats[id] = {
                    id,
                    name,
                    totalSales: 0,
                    transactionCount: 0,
                    variances: [],
                    shiftsCount: 0,
                    expectedCash: 0,
                    actualCash: 0
                };
            }

            const expected = Number(shift.expected_cash_total) || 0;
            const actual = Number(shift.actual_cash_counted) || 0;
            const variance = actual - expected;

            stats[id].variances.push(variance);
            stats[id].shiftsCount += 1;
            stats[id].expectedCash += expected;
            stats[id].actualCash += actual;
        });

        // 3. Calculate Derived Metrics
        return Object.values(stats).map((s: any) => {
            const avgTransactionValue = s.transactionCount > 0 ? s.totalSales / s.transactionCount : 0;
            const netVariance = s.variances.reduce((a: number, b: number) => a + b, 0);

            // Frequency of large variances (>50 naira)
            const varianceFrequency = s.shiftsCount > 0
                ? (s.variances.filter((v: number) => Math.abs(v) > 50).length / s.shiftsCount) * 100
                : 0;

            // Proprietary Accuracy Score Calculation
            // Base 100
            // Penalize for variance frequency (high frequency = bad habits)
            // Penalize for total magnitude of variance relative to sales? Or just absolute magnitude.
            // Previous formula: Math.max(0, 100 - (varianceFrequency * 0.5) - (Math.abs(netVariance) / 1000));
            const accuracyScore = Math.max(0, 100 - (varianceFrequency * 0.5) - (Math.abs(netVariance) / 1000));

            return {
                ...s,
                avgTransactionValue,
                netVariance,
                varianceFrequency,
                accuracyScore
            };
        }).sort((a, b) => b.totalSales - a.totalSales); // Default sort by sales volume

    }, [sales, shifts, loadingSales, loadingShifts]);

    return {
        data: performanceData,
        isLoading: loadingSales || loadingShifts
    };
};
