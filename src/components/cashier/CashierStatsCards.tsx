import { LucideIcon } from "lucide-react";
import { EnhancedStatCard } from "@/components/admin/EnhancedStatCard";

interface StatsCard {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  iconColor: string;
  route: string;
}

interface CashierStatsCardsProps {
  statsCards: StatsCard[];
  handleCardClick: (route: string) => void;
}

export const CashierStatsCards = ({ statsCards, handleCardClick }: CashierStatsCardsProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((card, index) => {
        // Extract trend and trendUp from description if possible, or use defaults
        const trendMatch = card.description.match(/([+-]\d+%)/);
        const trend = trendMatch ? trendMatch[1] : "";
        const trendUp = trend.startsWith('+');
        const comparisonLabel = card.description.replace(trend, "").trim() || "vs yesterday";

        let colorScheme: 'primary' | 'success' | 'warning' | 'danger' = 'primary';
        if (card.title === "Low Stock Items") colorScheme = 'warning';
        if (card.title === "Today's Sales") colorScheme = 'success';

        return (
          <EnhancedStatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={trend}
            trendUp={trendUp}
            route={card.route}
            onClick={handleCardClick}
            colorScheme={colorScheme}
            comparisonLabel={comparisonLabel}
          />
        );
      })}
    </div>
  );
};
