
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const useBranches = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('branches' as any)
                .select('*')
                .order('name');

            if (error) throw error;
            setBranches(data || []);
        } catch (error: any) {
            console.error('Error fetching branches:', error);
            toast({
                title: 'Error',
                description: 'Failed to load branches.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const addBranch = async (branch: Omit<Branch, 'id' | 'created_at'>) => {
        try {
            const { data, error } = await supabase
                .from('branches' as any)
                .insert(branch)
                .select()
                .single();

            if (error) throw error;
            setBranches(prev => [...prev, data]);
            toast({
                title: 'Success',
                description: 'Branch added successfully.',
            });
            return data;
        } catch (error: any) {
            console.error('Error adding branch:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to add branch.',
                variant: 'destructive',
            });
            return null;
        }
    };

    const updateBranch = async (id: string, updates: Partial<Branch>) => {
        try {
            const { data, error } = await supabase
                .from('branches' as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setBranches(prev => prev.map(b => b.id === id ? data : b));
            toast({
                title: 'Success',
                description: 'Branch updated successfully.',
            });
            return data;
        } catch (error: any) {
            console.error('Error updating branch:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update branch.',
                variant: 'destructive',
            });
            return null;
        }
    };

    return {
        branches,
        isLoading,
        fetchBranches,
        addBranch,
        updateBranch,
    };
};
