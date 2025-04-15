
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

const PharmacistDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Low Stock Items",
      value: "23",
      icon: AlertTriangle,
      description: "Items below reorder level",
    },
    {
      title: "Total Products",
      value: "1,456",
      icon: Package,
      description: "In current inventory",
    },
    {
      title: "Today's Sales",
      value: "145",
      icon: ShoppingCart,
      description: "Products sold today",
    },
    {
      title: "Expiring Soon",
      value: "12",
      icon: AlertCircle,
      description: "Products expiring in 30 days",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacist Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}
        </p>
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
          <h3 className="font-semibold mb-4">Low Stock Alerts</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Monitor items that need reordering
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Expiring Products</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Track products nearing expiration
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
