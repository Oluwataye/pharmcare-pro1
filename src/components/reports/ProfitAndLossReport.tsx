import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendingUp, TrendingDown, Wallet, Calculator, ArrowRight, Receipt, PieChart as PieChartIcon } from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ProfitAndLossReport = () => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

    const [data, setData] = useState<{
        revenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
        expenseBreakdown: { category: string; amount: number }[];
        recentTransactions: any[];
    }>({
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        expenseBreakdown: [],
        recentTransactions: []
    });

    useEffect(() => {
        fetchPandLData();
    }, [dateRange]);

    const fetchPandLData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Sales & Items for Revenue & COGS
            const { data: sales, error: salesError } = await supabase
                .from('sales' as any)
                .select(`
                    id, 
                    total, 
                    date,
                    sales_items (
                        quantity,
                        cost_price,
                        total
                    )
                `)
                .gte('date', dateRange.start)
                .lte('date', dateRange.end);

            if (salesError) throw salesError;

            // 2. Fetch Expenses for OPEX
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses' as any)
                .select('*')
                .gte('date', dateRange.start)
                .lte('date', dateRange.end);

            if (expensesError) throw expensesError;

            processFinancials(sales || [], expenses || []);
        } catch (error) {
            console.error("Error fetching P&L data:", error);
        } finally {
            setLoading(false);
        }
    };

    const processFinancials = (sales: any[], expenses: any[]) => {
        let revenue = 0;
        let cogs = 0;

        sales.forEach(sale => {
            revenue += Number(sale.total);
            sale.sales_items?.forEach((item: any) => {
                cogs += (Number(item.cost_price) || 0) * Number(item.quantity);
            });
        });

        let totalExpenses = 0;
        const breakdownMap: Record<string, number> = {};

        expenses.forEach(exp => {
            const amount = Number(exp.amount);
            totalExpenses += amount;
            breakdownMap[exp.category] = (breakdownMap[exp.category] || 0) + amount;
        });

        const sortedBreakdown = Object.entries(breakdownMap)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - totalExpenses;

        setData({
            revenue,
            cogs,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            expenseBreakdown: sortedBreakdown,
            recentTransactions: expenses.slice(0, 5)
        });
    };

    const chartData = [
        { name: 'Revenue', value: data.revenue },
        { name: 'COGS', value: data.cogs },
        { name: 'Gross Profit', value: data.grossProfit },
        { name: 'Expenses', value: data.expenses },
        { name: 'Net Profit', value: data.netProfit },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground animate-pulse">Calculating financial statement...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        P&L Performance Summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {format(parseISO(dateRange.start), 'MMM dd, yyyy')} - {format(parseISO(dateRange.end), 'MMM dd, yyyy')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-xs bg-background border rounded px-2 py-1"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-xs bg-background border rounded px-2 py-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={`₦${data.revenue.toLocaleString()}`}
                    icon={TrendingUp}
                    colorScheme="primary"
                />
                <MetricCard
                    title="Gross Profit"
                    value={`₦${data.grossProfit.toLocaleString()}`}
                    subValue={`${data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : 0}% Margin`}
                    icon={Receipt}
                    colorScheme="success"
                />
                <MetricCard
                    title="Total Expenses"
                    value={`₦${data.expenses.toLocaleString()}`}
                    icon={Wallet}
                    colorScheme="warning"
                />
                <MetricCard
                    title="Net Profit"
                    value={`₦${data.netProfit.toLocaleString()}`}
                    subValue={`${data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : 0}% Net Margin`}
                    icon={data.netProfit >= 0 ? TrendingUp : TrendingDown}
                    colorScheme={data.netProfit >= 0 ? "success" : "destructive"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Financial Overview</CardTitle>
                        <CardDescription>Visual breakdown of business performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(val: number) => `₦${val.toLocaleString()}`}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-amber-500" />
                            Expense Distribution
                        </CardTitle>
                        <CardDescription>By operating category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.expenseBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.expenseBreakdown}
                                                dataKey="amount"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                            >
                                                {data.expenseBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    {data.expenseBreakdown.map((item, index) => (
                                        <div key={item.category} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="font-medium">{item.category}</span>
                                            </div>
                                            <span className="text-muted-foreground">₦{item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs italic">
                                No expenses recorded for this period.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md">Statement of Profit and Loss</CardTitle>
                    <CardDescription>Detailed accounting for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableBody>
                            {/* Revenue Section */}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell>PARTICULARS</TableCell>
                                <TableCell className="text-right">AMOUNT (₦)</TableCell>
                                <TableCell className="text-right">% OF REVENUE</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="pl-6">Total Sales Revenue</TableCell>
                                <TableCell className="text-right">{data.revenue.toLocaleString()}</TableCell>
                                <TableCell className="text-right">100%</TableCell>
                            </TableRow>
                            <TableRow className="text-rose-600">
                                <TableCell className="pl-6">Less: Cost of Goods Sold (COGS)</TableCell>
                                <TableCell className="text-right">({data.cogs.toLocaleString()})</TableCell>
                                <TableCell className="text-right">{data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : 0}%</TableCell>
                            </TableRow>
                            <Separator />
                            <TableRow className="font-bold bg-primary/5 text-primary">
                                <TableCell>GROSS PROFIT</TableCell>
                                <TableCell className="text-right">{data.grossProfit.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : 0}%</TableCell>
                            </TableRow>

                            {/* Expenses Section */}
                            <TableRow className="bg-muted/30 font-semibold italic">
                                <TableCell colSpan={3}>Operating Expenses (OPEX)</TableCell>
                            </TableRow>
                            {data.expenseBreakdown.map(exp => (
                                <TableRow key={exp.category} className="text-muted-foreground">
                                    <TableCell className="pl-8">{exp.category}</TableCell>
                                    <TableCell className="text-right">({exp.amount.toLocaleString()})</TableCell>
                                    <TableCell className="text-right">{data.revenue > 0 ? ((exp.amount / data.revenue) * 100).toFixed(1) : 0}%</TableCell>
                                </TableRow>
                            ))}
                            {data.expenseBreakdown.length === 0 && (
                                <TableRow>
                                    <TableCell className="pl-8 italic text-xs">No operating expenses found</TableCell>
                                    <TableCell className="text-right">0.00</TableCell>
                                    <TableCell className="text-right">0%</TableCell>
                                </TableRow>
                            )}
                            <TableRow className="font-semibold text-rose-600">
                                <TableCell className="pl-6 font-bold">Total Operating Expenses</TableCell>
                                <TableCell className="text-right">({data.expenses.toLocaleString()})</TableCell>
                                <TableCell className="text-right">{data.revenue > 0 ? ((data.expenses / data.revenue) * 100).toFixed(1) : 0}%</TableCell>
                            </TableRow>

                            {/* Final Profit */}
                            <TableRow className={`font-bold text-lg ${data.netProfit >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                <TableCell>NET PROFIT / LOSS</TableCell>
                                <TableCell className="text-right">{data.netProfit.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : 0}%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfitAndLossReport;
