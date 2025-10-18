
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useFetchSales } from "@/hooks/useFetchSales";
import { CashierHeader } from "./CashierHeader";
import { CashierStatsCards } from "./CashierStatsCards";
import { RecentTransactionsCard } from "./RecentTransactionsCard";
import { LowStockAlertsCard } from "./LowStockAlertsCard";
import { TransactionsTable } from "./TransactionsTable";
import { NewSaleForm } from "./NewSaleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";

interface Transaction {
  id: number;
  customer: string;
  items: number;
  amount: number;
  time: string;
  date: string;
  status: string;
}

interface LowStockItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
}

export const CashierDashboardContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sales, refreshSales } = useFetchSales();
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Transform sales to transactions format
  const recentTransactions: Transaction[] = useMemo(() => {
    return sales.slice(0, 10).map(sale => ({
      id: parseInt(sale.id.substring(0, 8), 16),
      customer: sale.customerName || sale.businessName || 'Walk-in Customer',
      items: sale.items.length,
      amount: sale.total,
      time: new Date(sale.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(sale.date).toISOString().split('T')[0],
      status: sale.status === 'completed' ? 'Completed' : 'Pending'
    }));
  }, [sales]);

  // Mock low stock items for cashier view
  const lowStockItems: LowStockItem[] = [
    { id: 1, product: "Paracetamol", category: "Pain Relief", quantity: 10, reorderLevel: 15 },
    { id: 2, product: "Amoxicillin", category: "Antibiotics", quantity: 5, reorderLevel: 20 },
  ];

  const filteredTransactions = recentTransactions.filter(
    transaction => 
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewSale = () => {
    setShowNewSaleForm(true);
  };

  const handleSaleComplete = () => {
    toast({
      title: "Sale Completed",
      description: "The transaction was processed successfully",
    });
    setShowNewSaleForm(false);
    refreshSales(); // Refresh sales data after completion
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number) => {
    // For future implementation: navigate to specific item detail
    navigate(route);
  };

  // Calculate stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });
  
  const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const transactionsToday = todaySales.length;
  const uniqueCustomersToday = new Set(
    todaySales
      .map(sale => sale.customerName || sale.businessName)
      .filter(name => name && name !== 'Walk-in Customer')
  ).size;

  const statsCards = [
    {
      title: "Today's Sales",
      value: `₦${totalSalesToday.toLocaleString()}`,
      icon: DollarSign,
      description: `${transactionsToday} transactions`,
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Transactions",
      value: transactionsToday.toString(),
      icon: Receipt,
      description: "Today's count",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Customers",
      value: uniqueCustomersToday.toString(),
      icon: Users,
      description: "Unique customers today",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      description: "Needs attention",
      iconColor: "text-amber-500",
      route: "/inventory"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in px-2 md:px-0">
      <CashierHeader 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        handleNewSale={handleNewSale} 
      />

      {showNewSaleForm ? (
        <Card className="border-2 border-primary/10">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl">New Sale</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <NewSaleForm onComplete={handleSaleComplete} onCancel={() => setShowNewSaleForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <>
          <CashierStatsCards
            statsCards={statsCards}
            handleCardClick={handleCardClick}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <RecentTransactionsCard 
              filteredTransactions={filteredTransactions} 
              handleItemClick={handleItemClick} 
              handleCardClick={handleCardClick}
            />

            <LowStockAlertsCard 
              lowStockItems={lowStockItems}
              handleItemClick={handleItemClick}
              handleCardClick={handleCardClick}
            />
          </div>

          <TransactionsTable
            filteredTransactions={filteredTransactions}
            handleItemClick={handleItemClick}
          />
        </>
      )}
    </div>
  );
};
