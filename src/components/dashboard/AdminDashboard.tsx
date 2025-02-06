import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";
import { TrendingUp, Package, AlertTriangle, DollarSign } from "lucide-react";
import StatsGrid from "./StatsGrid";

const adminStats: DashboardStat[] = [
  {
    title: "Today's Sales",
    value: "₦1,234",
    icon: TrendingUp,
    trend: "+12.5%",
    trendUp: true,
  },
  {
    title: "Low Stock Items",
    value: "23",
    icon: AlertTriangle,
    trend: "+5",
    trendUp: false,
  },
  {
    title: "Total Products",
    value: "1,456",
    icon: Package,
    trend: "+3",
    trendUp: true,
  },
  {
    title: "Revenue (MTD)",
    value: "₦45,678",
    icon: DollarSign,
    trend: "+8.2%",
    trendUp: true,
  },
];

const AdminDashboard = () => {
  return (
    <>
      <StatsGrid stats={adminStats} />
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No recent activities
            </p>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Alerts</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No pending alerts
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;