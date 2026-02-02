
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WelcomeBanner } from "./WelcomeBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EnhancedTransactionsCard } from "./EnhancedTransactionsCard";
import { EnhancedLowStockCard } from "./EnhancedLowStockCard";
import { AlertTriangle, Package, TrendingUp, Activity } from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/contexts/OfflineContext";
import { useCallback } from "react";

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  const { inventory, isLoading: isInventoryLoading } = useInventory();
  const { toast } = useToast();

  const [todaySales, setTodaySales] = useState(0);
  const [revenueMTD, setRevenueMTD] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true);

  // Calculate inventory stats
  const lowStockItems = ((inventory || []) as any[])
    .filter(item => item.quantity <= item.reorderLevel)
    .map(item => ({
      id: item.id,
      product: item.name,
      category: item.category || 'Uncategorized',
      quantity: item.quantity,
      reorderLevel: item.reorderLevel
    }));
  const totalProducts = (inventory || []).length;

  const { pendingOperations } = useOffline();

  const fetchSalesStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch Recent Transactions from Supabase
      const { data: transactions, error: txError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Extract pending sales from OfflineContext
      const pendingSales = (pendingOperations || [])
        .filter(op => op.resource === 'sales')
        .map(op => {
          const sale = op.data;
          return {
            id: sale.transactionId || `PENDING-${op.id}`,
            product: sale.customerName || 'Walk-in Customer (Offline)',
            customer: `Items: ${Array.isArray(sale.items) ? sale.items.length : 1}`,
            amount: Number(sale.total || 0),
            date: `Pending Sync`
          };
        });

      if (transactions) {
        const formattedTx = (transactions as any[]).map(tx => ({
          id: tx.transaction_id || tx.id,
          product: tx.customer_name || 'Walk-in Customer',
          customer: `Items: ${(tx.items && Array.isArray(tx.items)) ? tx.items.length : 'N/A'}`,
          amount: Number(tx.total || 0),
          date: new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setRecentTransactions([...pendingSales, ...formattedTx].slice(0, 10));
      }

      // Fetch Today's Sales Sum
      const { data: todayData, error: todayError } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', today.toISOString());

      if (!todayError && todayData) {
        const dbTotal = todayData.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const pendingTotal = (pendingOperations || [])
          .filter(op => op.resource === 'sales' && new Date(op.timestamp) >= today)
          .reduce((sum, op) => sum + Number(op.data?.total || 0), 0);

        setTodaySales(dbTotal + pendingTotal);
      }

      // Fetch Month's Revenue
      const { data: monthData, error: monthError } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (!monthError && monthData) {
        const dbMonthTotal = monthData.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const pendingMonthTotal = (pendingOperations || [])
          .filter(op => op.resource === 'sales' && new Date(op.timestamp) >= firstDayOfMonth)
          .reduce((sum, op) => sum + Number(op.data?.total || 0), 0);

        setRevenueMTD(dbMonthTotal + pendingMonthTotal);
      }

    } catch (error) {
      console.error("Error fetching sales stats:", error);
    } finally {
      setIsLoadingSales(false);
    }
  }, [pendingOperations]);

  useEffect(() => {
    fetchSalesStats();
  }, [fetchSalesStats]);

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const handleItemClick = (route: string, id: number | string) => {
    navigate(route);
  };

  const stats = [
    {
      title: "Today's Sales",
      value: `₦${todaySales.toLocaleString()}`,
      icon: NairaSign,
      trend: "+0%", // Needs real trend calculation in future
      trendUp: true,
      route: "/sales",
      colorScheme: 'success' as const,
      comparisonLabel: "vs yesterday"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      trend: "Action Needed",
      trendUp: false,
      route: "/inventory",
      colorScheme: 'warning' as const,
      comparisonLabel: "restock now"
    },
    {
      title: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: Package,
      trend: "Active",
      trendUp: true,
      route: "/inventory",
      colorScheme: 'primary' as const,
      comparisonLabel: "in inventory"
    },
    {
      title: "Revenue (MTD)",
      value: `₦${revenueMTD.toLocaleString()}`,
      icon: TrendingUp,
      trend: "Month to Date",
      trendUp: true,
      route: "/reports",
      colorScheme: 'success' as const,
      comparisonLabel: "current month"
    },
    {
      title: "Live Analytics",
      value: "View Data",
      icon: Activity,
      trend: "Real-time",
      trendUp: true,
      route: "/analytics",
      colorScheme: 'primary' as const,
      comparisonLabel: "performance"
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

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={{
              value: 0, // Placeholder
              isPositive: stat.trendUp
            }}
            colorScheme={stat.colorScheme}
            description={stat.comparisonLabel}
            onClick={() => handleCardClick(stat.route)}
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
          items={lowStockItems.slice(0, 5)} // Show top 5
          onItemClick={handleItemClick}
          onViewAllClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default AdminDashboardContent;
