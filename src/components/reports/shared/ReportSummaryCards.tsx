import React from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardData {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: { value: number; isPositive: boolean };
    colorScheme?: 'primary' | 'success' | 'blue' | 'violet' | 'orange' | 'emerald';
}

interface ReportSummaryCardsProps {
    metrics: MetricCardData[];
    isLoading?: boolean;
    maxCards?: number;
    className?: string;
}

/**
 * Standardized KPI card grid for reports.
 * Enforces max 5 cards per report for consistency.
 */
export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
    metrics,
    isLoading = false,
    maxCards = 5,
    className = ''
}) => {
    // Enforce max cards limit
    const displayMetrics = (metrics || []).slice(0, maxCards);

    if (isLoading) {
        return (
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${Math.min(displayMetrics.length, 4)} ${className}`}>
                {Array.from({ length: Math.min(maxCards, 4) }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    if (displayMetrics.length === 0) {
        return null;
    }

    // Determine grid columns based on number of metrics
    const gridCols = displayMetrics.length <= 2 ? 'md:grid-cols-2' :
        displayMetrics.length === 3 ? 'md:grid-cols-3' :
            'md:grid-cols-2 lg:grid-cols-4';

    return (
        <div className={`grid gap-4 ${gridCols} ${className}`}>
            {displayMetrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    description={metric.description}
                    trend={metric.trend}
                    colorScheme={metric.colorScheme || 'primary'}
                />
            ))}
        </div>
    );
};
