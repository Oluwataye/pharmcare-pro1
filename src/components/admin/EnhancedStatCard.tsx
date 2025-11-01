import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  route: string;
  onClick: (route: string) => void;
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'normal' | 'large';
  comparisonLabel?: string;
}

export const EnhancedStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  route,
  onClick,
  colorScheme = 'primary',
  size = 'normal',
  comparisonLabel = 'vs yesterday'
}: EnhancedStatCardProps) => {
  const colorClasses = {
    primary: 'border-l-primary/50 from-primary/5',
    success: 'border-l-green-500 from-green-500/5',
    warning: 'border-l-amber-500 from-amber-500/5',
    danger: 'border-l-red-500 from-red-500/5'
  };

  const iconColors = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600'
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-l-4 group",
        colorClasses[colorScheme],
        size === 'large' && "md:col-span-2"
      )}
      onClick={() => onClick(route)}
    >
      <CardContent className={cn("p-6", size === 'large' && "md:p-8")}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <p className={cn(
              "font-bold mb-3 transition-all group-hover:scale-105",
              size === 'large' ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
            )}>
              {value}
            </p>
            <div className="flex items-center gap-2">
              {trendUp ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                trendUp ? "text-green-600" : "text-red-600"
              )}>
                {trend}
              </span>
              <span className="text-xs text-muted-foreground">
                {comparisonLabel}
              </span>
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br opacity-75 group-hover:opacity-100 transition-all group-hover:scale-110",
            iconColors[colorScheme]
          )}>
            <Icon className={cn(
              size === 'large' ? "h-8 w-8" : "h-6 w-6"
            )} />
          </div>
        </div>
      </CardContent>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none opacity-50",
        colorClasses[colorScheme]
      )} />
    </Card>
  );
};