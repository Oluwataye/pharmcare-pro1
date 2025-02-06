import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";
import { TrendingUp, Package, AlertTriangle, DollarSign, Activity } from "lucide-react";
import StatsGrid from "./StatsGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const AdminDashboard = () => {
  const { data: inventoryCount } = useQuery({
    queryKey: ['inventory-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: lowStockCount } = useQuery({
    queryKey: ['low-stock-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 10);
      return count || 0;
    }
  });

  const { data: salesData } = useQuery({
    queryKey: ['today-sales'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', today.toISOString());
      
      return data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    }
  });

  const adminStats: DashboardStat[] = [
    {
      title: "Today's Sales",
      value: `₦${salesData?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Low Stock Items",
      value: lowStockCount?.toString() || "0",
      icon: AlertTriangle,
      trend: "+5",
      trendUp: false,
    },
    {
      title: "Total Products",
      value: inventoryCount?.toString() || "0",
      icon: Package,
      trend: "+3",
      trendUp: true,
    },
    {
      title: "Revenue (MTD)",
      value: "₦45,678",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <StatsGrid stats={adminStats} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activities</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Today, 2:15 PM</span>
              <span>New inventory item added: Paracetamol</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Today, 1:30 PM</span>
              <span>Stock updated for: Amoxicillin</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Today, 11:45 AM</span>
              <span>New sale recorded: ₦12,500</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">System Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>5 items are running low on stock</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Package className="h-4 w-4" />
              <span>3 items need reordering</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Sales target achieved for the month</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;