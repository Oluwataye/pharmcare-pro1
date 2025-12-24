
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CashierHeader } from "./CashierHeader";
import { CashierStatsCards } from "./CashierStatsCards";
import { EnhancedTransactionsCard } from "@/components/admin/EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "@/components/admin/EnhancedLowStockCard";
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
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const recentTransactions: Transaction[] = [
    {
      id: 1,
      customer: "John Smith",
      items: 3,
      amount: 2500,
      time: "10:30 AM",
      date: "2023-04-15",
      status: "Completed"
    },
    {
      id: 2,
      customer: "Sarah Wilson",
      items: 5,
      amount: 4750,
      time: "11:45 AM",
      date: "2023-04-15",
      status: "Completed"
    },
    {
      id: 3,
      customer: "Michael Brown",
      items: 2,
      amount: 1800,
      time: "01:15 PM",
      date: "2023-04-15",
      status: "Completed"
    },
  ];

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
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number) => {
    // For future implementation: navigate to specific item detail
    navigate(route);
  };

  const statsCards = [
    {
      title: "Today's Sales",
      value: "₦9,050",
      icon: DollarSign,
      description: "+8% from yesterday",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Transactions",
      value: "12",
      icon: Receipt,
      description: "+2 since last shift",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Customers",
      value: "8",
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
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Cashier Dashboard</h1>
      </div>

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
            <EnhancedTransactionsCard
              transactions={filteredTransactions.map(t => ({
                id: t.id,
                product: `${t.items} items`,
                customer: t.customer,
                amount: t.amount,
                date: `Today, ${t.time}`
              }))}
              onItemClick={handleItemClick}
              onViewAllClick={handleCardClick}
            />

            <EnhancedLowStockCard
              items={lowStockItems}
              onItemClick={handleItemClick}
              onViewAllClick={handleCardClick}
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
