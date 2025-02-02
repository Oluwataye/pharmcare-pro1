import { DashboardStat } from "@/lib/types";
import DashboardStatCard from "./DashboardStatCard";

interface StatsGridProps {
  stats: DashboardStat[];
}

const StatsGrid = ({ stats }: StatsGridProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <DashboardStatCard key={stat.title} stat={stat} />
      ))}
    </div>
  );
};

export default StatsGrid;