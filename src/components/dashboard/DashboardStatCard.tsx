import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";

interface DashboardStatCardProps {
  stat: DashboardStat;
}

const DashboardStatCard = ({ stat }: DashboardStatCardProps) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-primary/10">
          <stat.icon className="h-6 w-6 text-primary" />
        </div>
        {stat.trend && (
          <span
            className={`text-sm font-medium ${
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
        <p className="text-2xl font-bold mt-1">{stat.value}</p>
      </div>
    </Card>
  );
};

export default DashboardStatCard;