
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Receipt,
  Clock,
  CircleDollarSign,
} from "lucide-react";

const CashierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: "Today's Sales",
      value: "₦45,230",
      icon: CircleDollarSign,
      description: "Total sales amount today",
    },
    {
      title: "Transactions",
      value: "24",
      icon: Receipt,
      description: "Total transactions today",
    },
    {
      title: "Active Cart",
      value: "1",
      icon: ShoppingCart,
      description: "Current transaction",
    },
    {
      title: "Last Sale",
      value: "10:45 AM",
      icon: Clock,
      description: "Most recent transaction",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
        <Button size="lg" onClick={() => navigate("/sales/new")}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          New Sale
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
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/sales")}
            >
              <Receipt className="mr-2 h-4 w-4" />
              View All Transactions
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/sales/new")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Start New Sale
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CashierDashboard;
