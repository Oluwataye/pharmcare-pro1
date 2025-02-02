import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  Pill,
  Receipt,
} from "lucide-react";
import { DashboardStat } from "@/lib/types";

const Dashboard = () => {
  const { user } = useAuth();

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

  const pharmacistStats: DashboardStat[] = [
    {
      title: "Low Stock Items",
      value: "23",
      icon: AlertTriangle,
      trend: "+5",
      trendUp: false,
    },
    {
      title: "Expiring Soon",
      value: "15",
      icon: Clock,
      trend: "+2",
      trendUp: false,
    },
    {
      title: "Total Products",
      value: "1,456",
      icon: Pill,
      trend: "+3",
      trendUp: true,
    },
    {
      title: "Purchase Orders",
      value: "8",
      icon: Package,
      trend: "+1",
      trendUp: true,
    },
  ];

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

  const getRoleStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return adminStats;
      case 'PHARMACIST':
        return pharmacistStats;
      case 'CASHIER':
        return cashierStats;
      default:
        return [];
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'ADMIN':
        return "Admin Dashboard";
      case 'PHARMACIST':
        return "Pharmacy Management";
      case 'CASHIER':
        return "Sales Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{getRoleTitle()}</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getRoleStats().map((stat) => (
          <Card key={stat.title} className="p-6">
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
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {user?.role === 'ADMIN' && (
          <>
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
          </>
        )}

        {user?.role === 'PHARMACIST' && (
          <>
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Expiring Medications</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  No medications expiring soon
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Purchase Orders</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  No pending purchase orders
                </p>
              </div>
            </Card>
          </>
        )}

        {user?.role === 'CASHIER' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;