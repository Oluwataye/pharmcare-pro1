import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";
import { TrendingUp, Receipt, DollarSign, Clock } from "lucide-react";
import StatsGrid from "./StatsGrid";

const cashierStats: DashboardStat[] = [
  {
    title: "Today's Sales",
    value: "₦1,234",
    icon: TrendingUp,
    trend: "+12.5%",
    trendUp: true,
  },
  {
    title: "Transactions Today",
    value: "45",
    icon: Receipt,
    trend: "+8",
    trendUp: true,
  },
  {
    title: "Average Sale Value",
    value: "₦567",
    icon: DollarSign,
    trend: "+2.3%",
    trendUp: true,
  },
  {
    title: "Pending Orders",
    value: "3",
    icon: Clock,
    trend: "0",
    trendUp: true,
  },
];

const CashierDashboard = () => {
  return (
    <>
      <StatsGrid stats={cashierStats} />
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No recent transactions
            </p>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Daily Summary</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No summary available
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default CashierDashboard;