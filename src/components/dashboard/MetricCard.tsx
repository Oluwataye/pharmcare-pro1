import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DivideIcon as LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    colorScheme?: "primary" | "success" | "warning" | "danger" | "slate" | "blue" | "emerald" | "amber" | "rose" | "violet";
    className?: string;
    onClick?: () => void;
}

export const MetricCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    colorScheme = "primary",
    className,
    onClick
}: MetricCardProps) => {
    const colorMap = {
        primary: "border-l-primary text-primary",
        success: "border-l-green-500 text-green-500",
        warning: "border-l-amber-500 text-amber-500",
        danger: "border-l-red-500 text-red-500",
        slate: "border-l-slate-500 text-slate-500",
        blue: "border-l-blue-500 text-blue-500",
        emerald: "border-l-emerald-500 text-emerald-500",
        amber: "border-l-amber-500 text-amber-500",
        rose: "border-l-rose-500 text-rose-500",
        violet: "border-l-violet-500 text-violet-500",
    };

    const iconBgMap = {
        primary: "bg-primary/10",
        success: "bg-green-100",
        warning: "bg-amber-100",
        danger: "bg-red-100",
        slate: "bg-slate-100",
        blue: "bg-blue-100",
        emerald: "bg-emerald-100",
        amber: "bg-amber-100",
        rose: "bg-rose-100",
        violet: "bg-violet-100",
    };

    return (
        <Card
            className={cn(
                "border-l-4 transition-all duration-200 hover:shadow-md", // Key visual upgrade
                colorMap[colorScheme] || colorMap.primary,
                onClick && "cursor-pointer hover:bg-slate-50",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-full", iconBgMap[colorScheme] || iconBgMap.primary)}>
                    <Icon className={cn("h-4 w-4", (colorMap[colorScheme] || colorMap.primary).split(" ")[1])} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span className={cn(
                                "mr-2 font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                        {description}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
