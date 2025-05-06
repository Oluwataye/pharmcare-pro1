
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";

interface StatsCard {
  title: string;
  value: string;
  icon: React.ElementType;
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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      {statsCards.map((card, index) => (
        <Card 
          key={index} 
          className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
          onClick={() => handleCardClick(card.route)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {card.title === "Today's Sales" && <TrendingUp className="h-3 w-3 text-green-500" />}
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
