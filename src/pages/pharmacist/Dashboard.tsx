import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Package,
  ClipboardList,
  TestTube
} from "lucide-react";

const PharmacistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Inventory",
      value: "1,234",
      icon: Package,
      description: "Total drug items in stock",
    },
    {
      title: "Low Stock Alerts",
      value: "12",
      icon: AlertCircle,
      description: "Items below minimum stock level",
    },
    {
      title: "Expiring Soon",
      value: "45",
      icon: TestTube,
      description: "Items expiring within 30 days",
    },
    {
      title: "Purchase Orders",
      value: "8",
      icon: ClipboardList,
      description: "Pending purchase orders",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
        <Button size="lg" onClick={() => navigate("/inventory")}>
          <Package className="mr-2 h-5 w-5" />
          Manage Inventory
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center space-x-2">
              <stat.icon className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </h3>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Low Stock Items</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/inventory")}
            >
              <Package className="mr-2 h-4 w-4" />
              View Inventory
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/inventory")}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              View All Activities
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
