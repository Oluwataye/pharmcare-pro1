import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ReportLayoutProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    isLoading?: boolean;
    error?: Error | null;
    emptyState?: React.ReactNode;
    className?: string;
}

/**
 * Standardized wrapper for all report components.
 * Provides consistent spacing, loading states, error handling, and empty states.
 */
export const ReportLayout: React.FC<ReportLayoutProps> = ({
    title,
    description,
    icon: Icon = FileText,
    children,
    isLoading = false,
    error = null,
    emptyState,
    className = ''
}) => {
    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Icon className="h-6 w-6" />
                        {title}
                    </h2>
                    {description && (
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    )}
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load report: {error.message}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Icon className="h-6 w-6" />
                        {title}
                    </h2>
                    {description && (
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    )}
                </div>
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    // Empty state
    if (emptyState) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Icon className="h-6 w-6" />
                        {title}
                    </h2>
                    {description && (
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    )}
                </div>
                {emptyState}
            </div>
        );
    }

    // Normal state
    return (
        <div className={`space-y-6 ${className}`}>
            <div>
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Icon className="h-6 w-6" />
                    {title}
                </h2>
                {description && (
                    <p className="text-muted-foreground text-sm mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
};
