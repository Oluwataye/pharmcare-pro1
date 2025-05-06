
import { useAuth } from "@/contexts/AuthContext";
import CashierDashboard from "./CashierDashboard";
import PharmacistDashboard from "./PharmacistDashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const stats = [
    {
      title: "Today's Sales",
      value: "₦1,234",
      icon: TrendingUp,
      trend: "+12.5%",
      trendUp: true,
      route: "/sales",
    },
    {
      title: "Low Stock Items",
      value: "23",
      icon: AlertTriangle,
      trend: "+5",
      trendUp: false,
      route: "/inventory",
    },
    {
      title: "Total Products",
      value: "1,456",
      icon: Package,
      trend: "+3",
      trendUp: true,
      route: "/inventory",
    },
    {
      title: "Revenue (MTD)",
      value: "₦45,678",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
      route: "/reports",
    },
  ];

  // Mock data for recent transactions and low stock alerts
  const recentTransactions = [
    { id: 1, product: "Paracetamol", customer: "John Doe", amount: 1200, date: "Today, 10:30 AM" },
    { id: 2, product: "Amoxicillin", customer: "Jane Smith", amount: 2500, date: "Today, 09:45 AM" },
    { id: 3, product: "Vitamin C", customer: "Mike Johnson", amount: 850, date: "Yesterday, 04:20 PM" },
  ];

  const lowStockItems = [
    { id: 1, product: "Paracetamol", category: "Pain Relief", quantity: 10, reorderLevel: 15 },
    { id: 2, product: "Amoxicillin", category: "Antibiotics", quantity: 5, reorderLevel: 20 },
    { id: 3, product: "Insulin", category: "Diabetes", quantity: 3, reorderLevel: 10 },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number) => {
    // For future implementation: navigate to specific item detail
    navigate(route);
  };

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Welcome to PharmaCare Pro - Your pharmacy management hub
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
            onClick={() => handleCardClick(stat.route)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                  <span
                    className={`inline-flex items-center text-sm font-medium ${
                      stat.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
                <div className="relative z-10">
                  <stat.icon className="h-6 md:h-8 w-6 md:w-8 text-primary opacity-75" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map(transaction => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                      onClick={() => handleItemClick('/sales', transaction.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{transaction.product}</p>
                        <p className="text-xs text-muted-foreground">{transaction.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent transactions
                </p>
              )}
              <div 
                className="text-sm text-primary font-medium cursor-pointer hover:underline"
                onClick={() => handleCardClick('/sales')}
              >
                View all transactions
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg font-semibold">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                      onClick={() => handleItemClick('/inventory', item.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{item.product}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-500">{item.quantity} left</p>
                        <p className="text-xs text-muted-foreground">Reorder: {item.reorderLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No low stock alerts
                </p>
              )}
              <div 
                className="text-sm text-primary font-medium cursor-pointer hover:underline"
                onClick={() => handleCardClick('/inventory')}
              >
                View all low stock items
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        </Card>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case "CASHIER":
      return <CashierDashboard />;
    case "PHARMACIST":
      return <PharmacistDashboard />;
    case "ADMIN":
    default:
      return <AdminDashboard />;
  }
};

export default Dashboard;
