
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DispenserHeader } from "./DispenserHeader";
import { DispenserStatsCards } from "./DispenserStatsCards";
import { EnhancedTransactionsCard } from "@/components/admin/EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "@/components/admin/EnhancedLowStockCard";
import { TransactionsTable } from "./TransactionsTable";
import { NewSaleForm } from "./NewSaleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Receipt, TrendingUp, Users } from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: number | string;
  customer: string;
  items: number;
  amount: number;
  time: string;
  date: string;
  status: string;
}

interface LowStockItem {
  id: number | string; // Updated to allow string (UUID)
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
}

export const DispenserDashboardContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { config } = useSystemConfig();
  const { inventory } = useInventory(); // Fetch live inventory

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [todayTxCount, setTodayTxCount] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);

  // Fetch sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch Today's Sales
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*') // Get all columns for Today
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (sales) {
        // Calculate Stats
        const total = sales.reduce((sum, sale) => sum + Number(sale.total || sale.total_amount || 0), 0);
        setTodaySalesTotal(total);
        setTodayTxCount(sales.length);

        const customers = new Set(sales.map(s => s.customer_name).filter(Boolean));
        setUniqueCustomers(customers.size);

        // Set Recent Transactions for Table/Cards
        const formattedTx: Transaction[] = sales.map(tx => ({
          id: tx.transaction_id || tx.id,
          customer: tx.customer_name || 'Walk-in Customer',
          items: (tx.items && Array.isArray(tx.items)) ? tx.items.length : 1, // approximate items count if array
          amount: Number(tx.total || tx.total_amount || 0),
          time: new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(tx.created_at).toISOString().split('T')[0],
          status: "Completed" // Assume completed for history
        }));
        setRecentTransactions(formattedTx);
      }
    };

    fetchSalesData();
  }, []);

  // Filter low stock items from live inventory
  // Limit to 5 for the card
  const lowStockItems: LowStockItem[] = inventory
    .filter(item => item.quantity <= item.reorderLevel)
    .map(item => ({
      id: item.id,
      product: item.name,
      category: item.category,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel
    }));

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
    // Refresh sales could be triggered here if we moved logic to function
    // For now we rely on simple state update or page refresh (or real-time subscription in future)
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number | string) => {
    navigate(route);
  };

  const statsCards = [
    {
      title: "Today's Sales",
      value: `${config.currencySymbol}${todaySalesTotal.toLocaleString()}`,
      icon: NairaSign,
      description: "Today's revenue",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Transactions",
      value: todayTxCount.toString(),
      icon: Receipt,
      description: "Sales today",
      iconColor: "text-primary",
      route: "/sales"
    },
    {
      title: "Customers",
      value: uniqueCustomers.toString(),
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Dispenser Dashboard</h1>
      </div>

      <DispenserHeader
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
          <DispenserStatsCards
            statsCards={statsCards}
            handleCardClick={handleCardClick}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <EnhancedTransactionsCard
              transactions={filteredTransactions.slice(0, 5).map(t => ({
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
              items={lowStockItems.slice(0, 5)}
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
