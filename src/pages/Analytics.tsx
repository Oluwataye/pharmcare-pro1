
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
            totalExpenses: 0,
            netProfit: 0,
            margin: 0,
            totalSales: 0
        },
        expenseCategories: []
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

            const startDateIso = startDate.toISOString();

            // 1. Fetch sales within period
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .gte('created_at', startDateIso);

            if (salesError) throw salesError;

            // 2. Fetch expenses within period
            const { data: expenses, error: expensesError } = await (supabase
                .from('expenses' as any) as any)
                .select('*')
                .gte('date', startDateIso.split('T')[0]);

            if (expensesError) {
                console.warn('Expenses fetch error (might not exist yet):', expensesError);
            }

            const safeExpenses = expenses || [];

            // 3. Fetch sales items for profit calculation
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
            let totalGrossProfit = relevantItems.reduce((sum, item) => {
                const cost = Number(item.cost_price || 0) * item.quantity;
                const revenue = Number(item.total);
                return sum + (revenue - cost);
            }, 0);

            let totalExpenses = safeExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            let netProfit = totalGrossProfit - totalExpenses;

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

            // Process Expense Categories for visualization
            const expenseCatMap: any = {};
            safeExpenses.forEach((e: any) => {
                if (!expenseCatMap[e.category]) expenseCatMap[e.category] = 0;
                expenseCatMap[e.category] += Number(e.amount);
            });
            const expenseCategories = Object.keys(expenseCatMap).map(cat => ({
                name: cat,
                value: expenseCatMap[cat]
            })).sort((a, b) => b.value - a.value);

            // Process Time Series Data
            const timeSeries: any = {};

            // Map sales
            sales?.forEach(s => {
                const date = new Date(s.created_at).toLocaleDateString();
                if (!timeSeries[date]) timeSeries[date] = { date, revenue: 0, profit: 0, expenses: 0, netProfit: 0 };

                const saleItems = relevantItems.filter(item => item.sale_id === s.id);
                const saleProfit = saleItems.reduce((sum, item) => {
                    const cost = Number(item.cost_price || 0) * item.quantity;
                    return sum + (Number(item.total) - cost);
                }, 0);

                timeSeries[date].revenue += Number(s.total);
                timeSeries[date].profit += saleProfit;
            });

            // Map expenses to time series
            safeExpenses.forEach((e: any) => {
                const date = new Date(e.date).toLocaleDateString();
                if (!timeSeries[date]) timeSeries[date] = { date, revenue: 0, profit: 0, expenses: 0, netProfit: 0 };
                timeSeries[date].expenses += Number(e.amount);
            });

            // Calculate daily net profit
            Object.keys(timeSeries).forEach(date => {
                timeSeries[date].netProfit = timeSeries[date].profit - timeSeries[date].expenses;
            });

            setData({
                salesOverTime: Object.values(timeSeries).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                topProducts,
                expenseCategories,
                summary: {
                    totalRevenue,
                    totalProfit: totalGrossProfit,
                    totalExpenses,
                    netProfit,
                    margin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
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
                    subValue={`${data.summary.margin.toFixed(1)}% gross margin`}
                    colorScheme="success"
                />
                <MetricCard
                    title="Expenses"
                    value={`₦${data.summary.totalExpenses.toLocaleString()}`}
                    icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
                    subValue="Total operational costs"
                    colorScheme="destructive"
                />
                <MetricCard
                    title="Net Profit"
                    value={`₦${data.summary.netProfit.toLocaleString()}`}
                    icon={<Activity className="h-5 w-5 text-indigo-600" />}
                    subValue={`${data.summary.totalRevenue > 0 ? ((data.summary.netProfit / data.summary.totalRevenue) * 100).toFixed(1) : 0}% net margin`}
                    colorScheme={data.summary.netProfit >= 0 ? "primary" : "destructive"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Financial Performance Trend</CardTitle>
                        <CardDescription>Revenue, Gross Profit, and Expenses over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.salesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val >= 1000 ? (val / 1000) + 'k' : val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(val: number) => [`₦${val.toLocaleString()}`, 'Amount']}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ef4444' }} />
                                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Expense Distribution</CardTitle>
                        <CardDescription>Breakdown by category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {data.expenseCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.expenseCategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.expenseCategories.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: number) => `₦${val.toLocaleString()}`}
                                    />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                <Wallet className="h-12 w-12 opacity-20" />
                                <p>No expenses recorded</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Expense Summary</CardTitle>
                        <CardDescription>Recent operational costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.expenseCategories.slice(0, 5).map((category: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-rose-50/30 border border-rose-100 transition-colors hover:bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-rose-400 rounded-full" />
                                        <div>
                                            <p className="font-semibold text-sm">{category.name}</p>
                                            <p className="text-xs text-muted-foreground">{((category.value / data.summary.totalExpenses) * 100).toFixed(1)}% of total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-rose-600">₦{category.value.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {data.expenseCategories.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No expenses in this period
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
