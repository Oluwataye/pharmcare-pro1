
import { useNavigate } from "react-router-dom";
import { TrendingUp, Package, AlertTriangle, DollarSign } from "lucide-react";
import { WelcomeBanner } from "./WelcomeBanner";
import { EnhancedStatCard } from "./EnhancedStatCard";
import { EnhancedTransactionsCard } from "./EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "./EnhancedLowStockCard";

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  
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

  const stats = [
    {
      title: "Today's Sales",
      value: "₦1,234",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
      route: "/sales",
      colorScheme: 'success' as const,
      size: 'large' as const,
      comparisonLabel: "vs yesterday (₦1,097)"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      trend: "+5 new",
      trendUp: false,
      route: "/inventory",
      colorScheme: 'warning' as const,
      comparisonLabel: "since yesterday"
    },
    {
      title: "Total Products",
      value: "1,456",
      icon: Package,
      trend: "+3",
      trendUp: true,
      route: "/inventory",
      colorScheme: 'primary' as const,
      comparisonLabel: "this week"
    },
    {
      title: "Revenue (MTD)",
      value: "₦45,678",
      icon: TrendingUp,
      trend: "+8.2%",
      trendUp: true,
      route: "/reports",
      colorScheme: 'success' as const,
      comparisonLabel: "vs last month"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
      </div>

      <WelcomeBanner 
        lowStockCount={lowStockItems.length} 
        onQuickAction={() => handleCardClick('/inventory')}
      />

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <EnhancedStatCard 
            key={stat.title}
            {...stat}
            onClick={handleCardClick}
          />
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <EnhancedTransactionsCard 
          transactions={recentTransactions}
          onItemClick={handleItemClick}
          onViewAllClick={handleCardClick}
        />

        <EnhancedLowStockCard 
          items={lowStockItems}
          onItemClick={handleItemClick}
          onViewAllClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default AdminDashboardContent;

