import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

const SalesReport = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    profit: 0,
    margin: 0,
    growth: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      // Fetch sales from the last 6 months
      const startDate = subMonths(new Date(), 6).toISOString();

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          date,
          sales_items (
            cost_price,
            quantity,
            total
          )
        `)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;

      processData(data);
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: any[]) => {
    let totalRevenue = 0;
    let totalCost = 0;
    const monthlyData: Record<string, { revenue: number; profit: number; cost: number }> = {};

    data.forEach(sale => {
      const monthKey = format(parseISO(sale.date), 'MMM yyyy');

      // Calculate sale cost
      const saleCost = sale.sales_items?.reduce((acc: number, item: any) => {
        // Use captured cost_price if available, otherwise 0
        const cost = Number(item.cost_price) || 0;
        return acc + (cost * item.quantity);
      }, 0) || 0;

      totalRevenue += Number(sale.total);
      totalCost += saleCost;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, profit: 0, cost: 0 };
      }
      monthlyData[monthKey].revenue += Number(sale.total);
      monthlyData[monthKey].cost += saleCost;
      monthlyData[monthKey].profit += (Number(sale.total) - saleCost);
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Convert to array for chart
    const processedChartData = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      sales: values.revenue,
      profit: values.profit
    }));

    setMetrics({
      revenue: totalRevenue,
      profit: profit,
      margin: margin,
      growth: 0 // Simplification for now
    });

    setChartData(processedChartData);
  };

  const chartConfig = {
    sales: {
      label: "Revenue (₦)",
      color: "#2563eb", // blue-600
    },
    profit: {
      label: "Gross Profit (₦)",
      color: "#10b981", // emerald-500
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue (6M)"
          value={`₦${metrics.revenue.toLocaleString()}`}
          icon={NairaSign}
          description="Last 6 months"
          trend={{ value: 12, isPositive: true }}
          colorScheme="primary"
        />
        <MetricCard
          title="Gross Profit"
          value={`₦${metrics.profit.toLocaleString()}`}
          icon={TrendingUp}
          description="Total earnings"
          colorScheme="success"
        />
        <MetricCard
          title="Net Margin"
          value={`${metrics.margin.toFixed(1)}%`}
          icon={Percent}
          description="Average margin"
          colorScheme="blue"
        />
        <MetricCard
          title="Avg. Monthly Sales"
          value={`₦${(metrics.revenue / (chartData.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingDown} // Just an icon choice
          description="Per month average"
          colorScheme="violet"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Performance (Revenue vs Profit)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₦${value.toLocaleString()}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Revenue"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Gross Profit"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReport;
