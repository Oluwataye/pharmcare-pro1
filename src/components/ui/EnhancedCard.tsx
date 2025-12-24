import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
    colorScheme?: 'primary' | 'success' | 'warning' | 'danger';
    children: React.ReactNode;
    gradient?: boolean;
}

export const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
    ({ className, colorScheme = 'primary', children, gradient = true, ...props }, ref) => {
        const colorClasses = {
            primary: 'border-l-primary/50 from-primary/5',
            success: 'border-l-green-500 from-green-500/5',
            warning: 'border-l-amber-500 from-amber-500/5',
            danger: 'border-l-red-500 from-red-500/5'
        };

        return (
            <Card
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4",
                    colorClasses[colorScheme],
                    className
                )}
                {...props}
            >
                <div className="relative z-10">
                    {children}
                </div>
                {gradient && (
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none opacity-50",
                        colorClasses[colorScheme]
                    )} />
                )}
            </Card>
        );
    }
);

EnhancedCard.displayName = "EnhancedCard";
