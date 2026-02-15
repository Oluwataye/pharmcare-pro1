import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, subDays } from 'date-fns';

export interface ReconciliationShift {
    id: string;
    shift_type: string;
    staff_name: string;
    staff_email: string;
    expected_cash_total: number;
    actual_cash_counted: number;
    expected_pos_total: number;
    expected_transfer_total: number;
    status: string;
    notes: string | null;
    created_at: string;
    variance: number; // Pre-calculated
}

export interface ReconciliationFilters {
    dateRange?: string;
    status?: string;
    searchTerm?: string;
}

export function useReconciliation(filters?: ReconciliationFilters) {
    const { toast } = useToast();

    const { data: shifts = [], isLoading, error, refetch } = useQuery({
        queryKey: ['reconciliation', filters],
        queryFn: async () => {
            console.log('[useReconciliation] Fetching shifts with filters:', filters);

            const startDate = startOfDay(
                subDays(new Date(), parseInt(filters?.dateRange || '7'))
            ).toISOString();

            let query = (supabase.from('staff_shifts' as any) as any)
                .select('*')
                .or(`created_at.gte.${startDate},end_time.gte.${startDate}`)
                .order('created_at', { ascending: false });

            // Apply status filter
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            // Database-level search filtering
            if (filters?.searchTerm && filters.searchTerm.trim()) {
                const searchPattern = `%${filters.searchTerm}%`;
                query = query.or(`staff_name.ilike.${searchPattern},notes.ilike.${searchPattern}`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[useReconciliation] Error:', error);
                throw error;
            }

            // Pre-calculate variance for each shift (once per fetch, not per render)
            const shiftsWithVariance = (data || []).map((shift: any) => ({
                ...shift,
                variance: (shift.actual_cash_counted || 0) - (shift.expected_cash_total || 0)
            }));

            console.log('[useReconciliation] Fetched', shiftsWithVariance.length, 'shifts');
            return shiftsWithVariance as ReconciliationShift[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5,    // 5 minutes
    });

    // Show error toast if query fails
    if (error) {
        toast({
            title: 'Error',
            description: 'Failed to load reconciliation records.',
            variant: 'destructive'
        });
    }

    return {
        shifts,
        isLoading,
        error,
        refetch
    };
}
