import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportChartPanelProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
    isLoading?: boolean;
    className?: string;
}

/**
 * Collapsible chart container with lazy rendering.
 * Only renders chart when expanded to improve performance.
 */
export const ReportChartPanel: React.FC<ReportChartPanelProps> = ({
    title,
    description,
    children,
    defaultExpanded = true,
    chartType = 'line',
    isLoading = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [hasRendered, setHasRendered] = useState(defaultExpanded);

    const handleExpandChange = (expanded: boolean) => {
        setIsExpanded(expanded);
        if (expanded && !hasRendered) {
            setHasRendered(true);
        }
    };

    return (
        <Card className={className}>
            <Collapsible open={isExpanded} onOpenChange={handleExpandChange}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                {title}
                            </CardTitle>
                            {description && (
                                <CardDescription>{description}</CardDescription>
                            )}
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 transition-transform',
                                        isExpanded && 'rotate-180'
                                    )}
                                />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full" />
                        ) : (
                            <div className="h-[400px]">
                                {/* Only render children if expanded or has been rendered before */}
                                {hasRendered && children}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
};
