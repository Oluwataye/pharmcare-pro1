
import { useState, useEffect, useCallback } from 'react';

export interface SystemConfig {
    currency: string;
    currencySymbol: string;
    taxRate: number;
    lowStockThreshold: number;
    enableDiscounts: boolean;
    manualDiscountEnabled: boolean;
    defaultDiscount: number;
    maxDiscount: number;
}

const DEFAULT_CONFIG: SystemConfig = {
    currency: 'NGN',
    currencySymbol: '₦',
    taxRate: 0,
    lowStockThreshold: 10,
    enableDiscounts: true,
    manualDiscountEnabled: true,
    defaultDiscount: 0,
    maxDiscount: 20,
};

const STORAGE_KEY = 'pharmcare_system_config';

export const useSystemConfig = () => {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadConfig = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) });
                } catch (e) {
                    console.error('Failed to parse system config', e);
                }
            }
            setIsLoaded(true);
        };

        loadConfig();

        // Listen for changes from other instances or tabs
        const handleStorageChange = () => {
            loadConfig();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateConfig = (updates: Partial<SystemConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        // Trigger a storage event so other tabs/components might react (optional)
        window.dispatchEvent(new Event('storage'));
    };

    return {
        config,
        updateConfig,
        isLoaded
    };
};
