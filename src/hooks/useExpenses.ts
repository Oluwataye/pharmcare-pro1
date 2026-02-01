
import { useState, useCallback } from 'react';
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

export const useExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchExpenses = useCallback(async (filters?: { startDate?: string; endDate?: string; category?: string }) => {
        setIsLoading(true);
        try {
            let query = (supabase.from('expenses' as any) as any).select('*');

            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }
            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }

            const { data, error } = await query.order('date', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "public.expenses" does not exist')) {
                    console.warn('Expenses table not found in Supabase.');
                    setExpenses([]);
                    return;
                }
                throw error;
            }

            setExpenses(data || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast({
                title: 'Error',
                description: 'Failed to load expenses',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const addExpense = async (expense: NewExpense) => {
        try {
            const { data, error } = await (supabase.from('expenses' as any) as any).insert({
                ...expense,
                created_by: (await supabase.auth.getUser()).data.user?.id
            }).select();

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Expense recorded successfully',
            });
            return data ? data[0] : true;
        } catch (error) {
            console.error('Error adding expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to record expense',
                variant: 'destructive',
            });
            return false;
        }
    };

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            const { error } = await (supabase.from('expenses' as any) as any).update(updates).eq('id', id);
            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Expense updated successfully',
            });
            return true;
        } catch (error) {
            console.error('Error updating expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to update expense',
                variant: 'destructive',
            });
            return false;
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            const { error } = await (supabase.from('expenses' as any) as any).delete().eq('id', id);
            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Expense deleted successfully',
            });
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete expense',
                variant: 'destructive',
            });
            return false;
        }
    };

    return {
        expenses,
        isLoading,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense
    };
};
