
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, TrendingDown, Package, Activity,
    Calendar, RefreshCcw, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedCard } from "@/components/ui/EnhancedCard";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
    const [period, setPeriod] = useState("daily");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        salesOverTime: [],
        topProducts: [],
        summary: {
            totalRevenue: 0,
            totalProfit: 0,
            margin: 0,
            totalSales: 0
        }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();

            if (period === "daily") startDate.setHours(0, 0, 0, 0);
            else if (period === "weekly") startDate.setDate(now.getDate() - 7);
            else if (period === "monthly") startDate.setMonth(now.getMonth() - 1);
            else if (period === "yearly") startDate.setFullYear(now.getFullYear() - 1);

            // Fetch sales within period
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .gte('created_at', startDate.toISOString());

            if (salesError) throw salesError;

            // Fetch all sales items for these sales to calculate profit
            // We'll fetch all items and filter by sale_id if the list is manageable, 
            // or fetch specifically for those IDs.
            const saleIds = (sales || []).map(s => s.id);

            let relevantItems: any[] = [];
            if (saleIds.length > 0) {
                const { data: items, error: itemsError } = await supabase
                    .from('sales_items')
                    .select('*')
                    .in('sale_id', saleIds);
                if (itemsError) throw itemsError;
                relevantItems = items || [];
            }

            // Process Summary
            let totalRevenue = (sales || []).reduce((sum, s) => sum + Number(s.total), 0);
            let totalProfit = relevantItems.reduce((sum, item) => {
                const cost = Number(item.cost_price || 0) * item.quantity;
                const revenue = Number(item.total);
                return sum + (revenue - cost);
            }, 0);

            // Process Top Products
            const productMap: any = {};
            relevantItems.forEach(item => {
                if (!productMap[item.product_name]) {
                    productMap[item.product_name] = {
                        name: item.product_name,
                        revenue: 0,
                        profit: 0,
                        quantity: 0
                    };
                }
                const cost = Number(item.cost_price || 0) * item.quantity;
                productMap[item.product_name].revenue += Number(item.total);
                productMap[item.product_name].profit += (Number(item.total) - cost);
                productMap[item.product_name].quantity += item.quantity;
            });

            const topProducts = Object.values(productMap)
                .sort((a: any, b: any) => b.profit - a.profit)
                .slice(0, 5);

            // Process Time Series Data
            const timeSeries: any = {};
            sales?.forEach(s => {
                const date = new Date(s.created_at).toLocaleDateString();
                if (!timeSeries[date]) timeSeries[date] = { date, revenue: 0, profit: 0, count: 0 };

                // Calculate profit for this specific sale
                const saleItems = relevantItems.filter(item => item.sale_id === s.id);
                const saleProfit = saleItems.reduce((sum, item) => {
                    const cost = Number(item.cost_price || 0) * item.quantity;
                    return sum + (Number(item.total) - cost);
                }, 0);

                timeSeries[date].revenue += Number(s.total);
                timeSeries[date].profit += saleProfit;
                timeSeries[date].count++;
            });

            setData({
                salesOverTime: Object.values(timeSeries),
                topProducts,
                summary: {
                    totalRevenue,
                    totalProfit,
                    margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
                    totalSales: sales?.length || 0
                }
            });
        } catch (err) {
            console.error("Analytics Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    if (loading) return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" />
                        Live Product Analytics
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">Real-time performance tracking for inventory and sales</p>
                </div>
                <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 bg-transparent">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Today</SelectItem>
                            <SelectItem value="weekly">Last 7 Days</SelectItem>
                            <SelectItem value="monthly">Last 30 Days</SelectItem>
                            <SelectItem value="yearly">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Revenue"
                    value={`₦${data.summary.totalRevenue.toLocaleString()}`}
                    icon={<NairaSign className="h-5 w-5 text-blue-600" />}
                    subValue="Total sales in period"
                    colorScheme="primary"
                />
                <MetricCard
                    title="Gross Profit"
                    value={`₦${data.summary.totalProfit.toLocaleString()}`}
                    icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                    subValue={`${data.summary.margin.toFixed(1)}% profit margin`}
                    colorScheme="success"
                />
                <MetricCard
                    title="Orders"
                    value={data.summary.totalSales}
                    icon={<Package className="h-5 w-5 text-orange-600" />}
                    subValue="Completed transactions"
                    colorScheme="warning"
                />
                <MetricCard
                    title="Analysis"
                    value="Active"
                    icon={<RefreshCcw className="h-5 w-5 text-indigo-600 animate-spin-slow" />}
                    subValue="Real-time data stream"
                    colorScheme="primary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Profitability Trend</CardTitle>
                        <CardDescription>Revenue and profit trajectory over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.salesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(val: number) => [`₦${val.toLocaleString()}`, 'Amount']}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Performing Products</CardTitle>
                        <CardDescription>Highest profit items based on real sales</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topProducts.map((product: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 transition-colors hover:bg-white dark:bg-slate-900/50 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs dark:bg-blue-900/30 dark:text-blue-400">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">₦{product.profit.toLocaleString()}</p>
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                            {product.revenue > 0 ? ((product.profit / product.revenue) * 100).toFixed(0) : 0}% margin
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {data.topProducts.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No sales data in this period
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, subValue, colorScheme = 'primary' }: any) => {
    return (
        <EnhancedCard
            colorScheme={colorScheme}
            className="transition-all duration-300 hover:shadow-lg cursor-pointer group"
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
                        <div className="text-2xl font-bold tracking-tight group-hover:scale-105 transition-transform">{value}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {subValue}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </EnhancedCard>
    );
};

export default Analytics;
