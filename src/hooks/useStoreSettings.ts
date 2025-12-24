import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoreSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  print_show_logo: boolean;
  print_show_address: boolean;
  print_show_email: boolean;
  print_show_phone: boolean;
  print_show_footer: boolean;
}

// Global cache for store settings
let cachedSettings: StoreSettings | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Listeners for cache invalidation
const listeners = new Set<() => void>();

export const invalidateStoreSettingsCache = () => {
  cachedSettings = null;
  cacheTimestamp = null;
  listeners.forEach(listener => listener());
};

export const useStoreSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(cachedSettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cachedSettings && cacheTimestamp) {
      const age = Date.now() - cacheTimestamp;
      if (age < CACHE_DURATION) {
        setSettings(cachedSettings);
        setIsLoading(false);
        return cachedSettings;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        cachedSettings = data as StoreSettings;
        cacheTimestamp = Date.now();
        setSettings(cachedSettings);
        return cachedSettings;
      }

      throw new Error('No store settings found');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch store settings');
      setError(error);
      console.error('Error fetching store settings:', error);

      // Don't show toast on mount, only on explicit refresh
      if (forceRefresh) {
        toast({
          title: 'Error',
          description: 'Failed to load store settings',
          variant: 'destructive',
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(() => {
    return fetchSettings(true);
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();

    // Register listener for cache invalidation
    const listener = () => {
      fetchSettings(true);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refresh,
  };
};
