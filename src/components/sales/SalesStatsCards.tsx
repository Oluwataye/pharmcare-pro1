import { DollarSign, Receipt, TrendingUp, Percent, Banknote } from "lucide-react";
import { EnhancedStatCard } from "@/components/admin/EnhancedStatCard";

interface SalesStatsCardsProps {
  totalSalesToday: number;
  totalTransactions: number;
  averageSaleValue: number;
  totalDiscounts?: number;
  totalRetailSales?: number;
  totalWholesaleSales?: number;
}

const SalesStatsCards = ({
  totalSalesToday,
  totalTransactions,
  averageSaleValue,
  totalDiscounts = 0,
  totalRetailSales,
  totalWholesaleSales,
}: SalesStatsCardsProps) => {
  const handleCardClick = (route: string) => {
    // Optional navigation logic
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <EnhancedStatCard
        title="Total Sales Today"
        value={`₦${totalSalesToday.toLocaleString()}`}
        icon={DollarSign}
        trend=""
        trendUp={true}
        route="/sales"
        onClick={handleCardClick}
        colorScheme="success"
        comparisonLabel="Gross revenue today"
      />
      <EnhancedStatCard
        title="Total Transactions"
        value={totalTransactions.toString()}
        icon={Receipt}
        trend=""
        trendUp={true}
        route="/sales"
        onClick={handleCardClick}
        colorScheme="primary"
        comparisonLabel="Total orders processed"
      />
      <EnhancedStatCard
        title="Average Sale Value"
        value={`₦${averageSaleValue.toLocaleString()}`}
        icon={Banknote}
        trend=""
        trendUp={true}
        route="/sales"
        onClick={handleCardClick}
        colorScheme="primary"
        comparisonLabel="Per transaction average"
      />
      <EnhancedStatCard
        title="Total Discounts"
        value={`₦${totalDiscounts.toLocaleString()}`}
        icon={Percent}
        trend=""
        trendUp={false}
        route="/sales"
        onClick={handleCardClick}
        colorScheme="warning"
        comparisonLabel="Total reductions applied"
      />
    </div>
  );
};

export default SalesStatsCards;
