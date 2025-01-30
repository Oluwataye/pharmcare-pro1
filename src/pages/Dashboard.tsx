import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Today's Sales",
      value: "$1,234",
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
      value: "$45,678",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to PharmaCare Pro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <stat.icon className="h-8 w-8 text-primary" />
              <span
                className={`text-sm ${
                  stat.trendUp ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend}
              </span>
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
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No recent transactions
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Low Stock Alerts</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No low stock alerts
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;