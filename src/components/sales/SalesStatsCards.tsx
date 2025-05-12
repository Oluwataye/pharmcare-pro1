
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";

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
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{totalSalesToday.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Sale Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{averageSaleValue.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{totalDiscounts.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesStatsCards;
