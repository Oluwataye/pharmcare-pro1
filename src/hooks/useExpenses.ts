import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string | null;
    reference: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export type NewExpense = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export interface ExpenseFilters {
    startDate?: string;
    endDate?: string;
    category?: string;
    branchId?: string;
    searchTerm?: string;
}

export const useExpenses = (filters?: ExpenseFilters) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch expenses with React Query caching
    const { data: expenses = [], isLoading, error, refetch } = useQuery({
        queryKey: ['expenses', filters],
        queryFn: async () => {
            console.log('[useExpenses] Fetching expenses with filters:', filters);

            let query = (supabase.from('expenses' as any) as any).select('*');

            // Apply filters
            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }
            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters?.branchId) {
                query = query.eq('branch_id', filters.branchId);
            }

            // Database-level search filtering
            if (filters?.searchTerm && filters.searchTerm.trim()) {
                const searchPattern = `%${filters.searchTerm}%`;
                query = query.or(`description.ilike.${searchPattern},reference.ilike.${searchPattern},category.ilike.${searchPattern}`);
            }

            const { data, error } = await query.order('date', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "public.expenses" does not exist')) {
                    console.warn('Expenses table not found in Supabase.');
                    return [];
                }
                throw error;
            }

            console.log('[useExpenses] Fetched', data?.length || 0, 'expenses');
            return data || [];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5,    // 5 minutes (formerly cacheTime)
    });

    // Add expense mutation with optimistic updates
    const addExpenseMutation = useMutation({
        mutationFn: async (expense: NewExpense) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles' as any).select('branch_id').eq('user_id', user?.id).single() as any;

            const { data, error } = await (supabase.from('expenses' as any) as any).insert({
                ...expense,
                created_by: user?.id,
                branch_id: profile?.branch_id
            }).select();

            if (error) throw error;
            return data ? data[0] : null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({
                title: 'Success',
                description: 'Expense recorded successfully',
            });
        },
        onError: (error) => {
            console.error('Error adding expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to record expense',
                variant: 'destructive',
            });
        }
    });

    // Update expense mutation
    const updateExpenseMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
            const { error } = await (supabase.from('expenses' as any) as any).update(updates).eq('id', id);
            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({
                title: 'Success',
                description: 'Expense updated successfully',
            });
        },
        onError: (error) => {
            console.error('Error updating expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to update expense',
                variant: 'destructive',
            });
        }
    });

    // Delete expense mutation
    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase.from('expenses' as any) as any).delete().eq('id', id);
            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({
                title: 'Success',
                description: 'Expense deleted successfully',
            });
        },
        onError: (error) => {
            console.error('Error deleting expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete expense',
                variant: 'destructive',
            });
        }
    });

    return {
        expenses,
        isLoading,
        error,
        refetch,
        addExpense: addExpenseMutation.mutate,
        updateExpense: (id: string, updates: Partial<Expense>) => updateExpenseMutation.mutate({ id, updates }),
        deleteExpense: deleteExpenseMutation.mutate,
        isAdding: addExpenseMutation.isPending,
        isUpdating: updateExpenseMutation.isPending,
        isDeleting: deleteExpenseMutation.isPending,
    };
};
