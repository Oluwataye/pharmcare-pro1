import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  stat: DashboardStat;
}

const DashboardStatCard = ({ stat }: DashboardStatCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <stat.icon className="h-8 w-8 text-primary" />
        {stat.trend && (
          <span
            className={`text-sm ${
              stat.trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {stat.trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {stat.title}
        </h3>
        <p className="text-2xl font-bold">{stat.value}</p>
      </div>
    </Card>
  );
};

export default DashboardStatCard;