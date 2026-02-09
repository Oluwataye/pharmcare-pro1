import { useState, useEffect } from 'react';

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    branchIds?: string[];
    staffIds?: string[];
    paymentModes?: string[];
    searchQuery?: string;
    [key: string]: any; // For custom filters
}

/**
 * Hook to manage report filters with localStorage persistence.
 * Filters are saved per report and restored on subsequent visits.
 */
export const useReportFilters = (reportId: string, defaults: ReportFilters) => {
    const storageKey = `report-filters-${reportId}`;

    // Initialize filters from localStorage or defaults
    const [filters, setFilters] = useState<ReportFilters>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new filter fields
                return { ...defaults, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load report filters from localStorage:', error);
        }
        return defaults;
    });

    // Save filters to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(filters));
        } catch (error) {
            console.error('Failed to save report filters to localStorage:', error);
        }
    }, [filters, storageKey]);

    // Reset filters to defaults
    const resetFilters = () => {
        setFilters(defaults);
    };

    // Update specific filter
    const updateFilter = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Update multiple filters at once
    const updateFilters = (updates: Partial<ReportFilters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    };

    return {
        filters,
        setFilters,
        updateFilter,
        updateFilters,
        resetFilters
    };
};
