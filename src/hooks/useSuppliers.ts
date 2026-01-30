
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Supplier, NewSupplier } from '@/types/supplier';

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await (supabase
                .from('suppliers' as any) as any)
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "public.suppliers" does not exist')) {
                    console.warn('Suppliers table not found in Supabase. Returning empty list.');
                    setSuppliers([]);
                    return;
                }
                throw error;
            }

            setSuppliers(data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast({
                title: 'Error',
                description: 'Failed to load suppliers',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const addSupplier = async (supplier: NewSupplier) => {
        try {
            const { data, error } = await (supabase.from('suppliers' as any) as any).insert(supplier).select();
            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Supplier added successfully',
            });
            fetchSuppliers();
            return data ? data[0] : true;
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to add supplier',
                variant: 'destructive',
            });
            return false;
        }
    };

    const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
        try {
            const { error } = await (supabase.from('suppliers' as any) as any).update(updates).eq('id', id);
            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Supplier updated successfully',
            });
            fetchSuppliers();
            return true;
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to update supplier',
                variant: 'destructive',
            });
            return false;
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await (supabase.from('suppliers' as any) as any).delete().eq('id', id);
            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Supplier deleted successfully',
            });
            fetchSuppliers();
            return true;
        } catch (error) {
            console.error('Error deleting supplier:', error);
            if (error instanceof Error && error.message.includes('foreign key')) {
                toast({
                    title: 'Cannot Delete',
                    description: 'This supplier has linked inventory items.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to delete supplier',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };

    return {
        suppliers,
        isLoading,
        fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier
    };
};
