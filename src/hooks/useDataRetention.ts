
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DataRetentionConfig {
    id: string;
    table_name: string;
    retention_days: number;
    is_active: boolean;
    last_cleanup_at: string | null;
    updated_at: string;
}

export const useDataRetention = () => {
    const [configs, setConfigs] = useState<DataRetentionConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchConfigs = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('data_retention_config')
                .select('*')
                .order('table_name');

            if (error) throw error;

            if (data) {
                setConfigs(data.map(item => ({
                    ...item,
                    is_active: item.is_active ?? true
                })) as unknown as DataRetentionConfig[]);
            }
        } catch (error: any) {
            console.error('Error fetching retention configs:', error);
            // Don't show toast on load to avoid spam if table is empty/unreachable
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateConfig = async (id: string, updates: Partial<DataRetentionConfig>) => {
        try {
            const { error } = await supabase
                .from('data_retention_config')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

            toast({
                title: "Success",
                description: "Retention policy updated successfully",
            });
            return true;
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update policy",
                variant: "destructive",
            });
            return false;
        }
    };

    const runCleanup = async (tableName: string) => {
        try {
            const { data, error } = await supabase.functions.invoke('cleanup-data', {
                body: { table: tableName }
            });

            if (error) throw error;

            toast({
                title: "Cleanup Initiated",
                description: `Cleanup job for ${tableName} has been started.`,
            });
            return true;
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to run cleanup job",
                variant: "destructive",
            });
            return false;
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    return {
        configs,
        isLoading,
        updateConfig,
        runCleanup,
        refresh: fetchConfigs
    };
};
