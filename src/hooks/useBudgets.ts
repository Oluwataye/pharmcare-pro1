
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Budget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchBudgets = useCallback(async (year?: number, month?: number, branchId?: string) => {
        setIsLoading(true);
        try {
            let query = supabase.from('budgets' as any).select('*');

            if (year) query = query.eq('year', year);
            if (month) query = query.eq('month', month);
            if (branchId) {
                query = query.eq('branch_id', branchId);
            } else {
                query = query.is('branch_id', null);
            }

            const { data, error } = await query;

            if (error) throw error;
            setBudgets((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching budgets:', error);
            toast({
                title: 'Error',
                description: 'Failed to load budgets.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const saveBudget = async (budget: Omit<Budget, 'id' | 'created_at'>) => {
        try {
            const { data, error } = await supabase
                .from('budgets' as any)
                .upsert(budget as any, {
                    onConflict: 'branch_id,category,month,year'
                })
                .select()
                .single();

            if (error) throw error;

            setBudgets((prev: any) => {
                const index = prev.findIndex((b: any) => b.category === (data as any).category && b.month === (data as any).month && b.year === (data as any).year);
                if (index > -1) {
                    const next = [...prev];
                    next[index] = data as any;
                    return next;
                }
                return [...prev, data as any];
            }) as any;

            toast({
                title: 'Success',
                description: 'Budget saved successfully.',
            });
            return data;
        } catch (error: any) {
            console.error('Error saving budget:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save budget.',
                variant: 'destructive',
            });
            return null;
        }
    };

    return {
        budgets,
        isLoading,
        fetchBudgets,
        saveBudget,
    };
};
