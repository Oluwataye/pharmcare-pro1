
import { useNavigate } from "react-router-dom";
import { AdminStats } from "./AdminStats";
import { RecentTransactionsCard } from "./RecentTransactionsCard";
import { LowStockAlertsCard } from "./LowStockAlertsCard";

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

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Welcome to PharmaCare Pro - Your pharmacy management hub
        </p>
      </div>

      <AdminStats onCardClick={handleCardClick} />

      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactionsCard 
          transactions={recentTransactions}
          onItemClick={handleItemClick}
          onViewAllClick={handleCardClick}
        />

        <LowStockAlertsCard 
          items={lowStockItems}
          onItemClick={handleItemClick}
          onViewAllClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default AdminDashboardContent;

