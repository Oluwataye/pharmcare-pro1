import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  ShoppingCart,
  Settings,
  TrendingUp,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Users",
      value: "23",
      description: "Active system users",
      icon: Users,
      link: "/users",
    },
    {
      title: "Inventory Items",
      value: "1,234",
      description: "Products in stock",
      icon: Package,
      link: "/inventory",
    },
    {
      title: "Total Sales",
      value: "₦45,678",
      description: "Last 30 days",
      icon: ShoppingCart,
      link: "/sales",
    },
    {
      title: "System Health",
      value: "98%",
      description: "All systems operational",
      icon: Settings,
      link: "/settings",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the super admin control panel
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(stat.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No recent activities to display
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Health</span>
                <span className="text-sm font-medium text-green-600">Good</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;