
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendingUp, TrendingDown, Percent, Tag } from "lucide-react";
import { NairaSign } from "@/components/icons/NairaSign";
import { format, subMonths, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const DiscountReport = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalDiscountGiven: 0,
        avgDiscountPerSale: 0,
        discountFrequency: 0, // % of sales with discount
        topDiscountMethod: "None"
    });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [distributionData, setDistributionData] = useState<any[]>([]);
    const [recentDiscounts, setRecentDiscounts] = useState<any[]>([]);

    useEffect(() => {
        fetchDiscountData();
    }, []);

    const fetchDiscountData = async () => {
        try {
            setLoading(true);
            // Fetch sales from the last 6 months
            const startDate = subMonths(new Date(), 6).toISOString();

            const { data: salesData, error } = await supabase
                .from('sales')
                .select(`
          id,
          total,
          discount,
          manual_discount,
          date,
          sales_items (
            quantity,
            price, 
            discount
          )
        `)
                .gte('date', startDate)
                .order('date', { ascending: true });

            if (error) throw error;

            processDiscountData(salesData || []);
        } catch (error) {
            console.error("Error fetching discount report:", error);
        } finally {
            setLoading(false);
        }
    };

    const processDiscountData = (data: any[]) => {
        let totalDiscountVal = 0;
        let totalSalesCount = data.length;
        let salesWithDiscountCount = 0;

        let totalManualDiscount = 0;
        let totalPercentDiscount = 0;
        let totalItemDiscount = 0;

        const monthlyData: Record<string, { manual: number; percent: number; item: number; total: number }> = {};

        const recentDiscountedSales: any[] = [];

        data.forEach(sale => {
            const monthKey = format(parseISO(sale.date), 'MMM yyyy');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { manual: 0, percent: 0, item: 0, total: 0 };
            }

            // 1. Manual Discount (Fixed Amount)
            const manualDisc = Number(sale.manual_discount) || 0;

            // 2. Percentage Discount (Overall)
            // Percentage is applied to Subtotal... but we only have Total. 
            // Approximation: Total = (Subtotal - ItemDiscounts) * (1 - Percent/100) - Manual
            // Actually, looking at calculation logic: 
            // Total = Subtotal - (PercentDisc + ItemDisc + ManualDisc)
            // So valid PercentAmount = (Subtotal * Percent / 100)

            // Let's reconstruct Item Discount first
            let saleItemDiscount = 0;
            let saleSubtotal = 0;

            sale.sales_items?.forEach((item: any) => {
                const itemPrice = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                const itemDiscPercent = Number(item.discount) || 0;

                const lineTotal = itemPrice * qty;
                const lineDisc = lineTotal * (itemDiscPercent / 100);

                saleItemDiscount += lineDisc;
                saleSubtotal += lineTotal;
            });

            // Now calculate Percent Discount Amount based on Subtotal
            const overallPercent = Number(sale.discount) || 0;
            const percentDiscAmount = (saleSubtotal * overallPercent) / 100;

            // Aggregates
            totalManualDiscount += manualDisc;
            totalPercentDiscount += percentDiscAmount;
            totalItemDiscount += saleItemDiscount;

            const totalSaleDiscount = manualDisc + percentDiscAmount + saleItemDiscount;
            totalDiscountVal += totalSaleDiscount;

            if (totalSaleDiscount > 0) {
                salesWithDiscountCount++;

                // Add to recent list if significant (e.g. recent 50 sales, filtered later)
                recentDiscountedSales.push({
                    id: sale.id,
                    date: sale.date,
                    total: sale.total,
                    discountTotal: totalSaleDiscount,
                    breakdown: {
                        manual: manualDisc,
                        percent: percentDiscAmount,
                        item: saleItemDiscount
                    }
                });
            }

            // Monthly Trend
            monthlyData[monthKey].manual += manualDisc;
            monthlyData[monthKey].percent += percentDiscAmount;
            monthlyData[monthKey].item += saleItemDiscount;
            monthlyData[monthKey].total += totalSaleDiscount;
        });

        // Sort recent sales by date desc and take top 5
        const topRecent = recentDiscountedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        // Prepare Chart Data
        const processedTrendData = Object.entries(monthlyData).map(([month, values]) => ({
            month,
            Manual: values.manual,
            Percentage: values.percent,
            Item: values.item,
            Total: values.total
        }));

        // Distribution Data
        const processedDistData = [
            { name: "Manual (Fixed)", value: totalManualDiscount, color: "#f97316" }, // orange
            { name: "Percentage (Overall)", value: totalPercentDiscount, color: "#3b82f6" }, // blue
            { name: "Item-level", value: totalItemDiscount, color: "#10b981" }, // green
        ].filter(d => d.value > 0);

        // Metrics
        const avgDiscount = salesWithDiscountCount > 0 ? totalDiscountVal / salesWithDiscountCount : 0;
        const frequency = totalSalesCount > 0 ? (salesWithDiscountCount / totalSalesCount) * 100 : 0;

        // Determine top method
        let topMethod = "None";
        const maxVal = Math.max(totalManualDiscount, totalPercentDiscount, totalItemDiscount);
        if (maxVal > 0) {
            if (maxVal === totalManualDiscount) topMethod = "Manual (Fixed)";
            else if (maxVal === totalPercentDiscount) topMethod = "Overall %";
            else topMethod = "Item-level";
        }

        setMetrics({
            totalDiscountGiven: totalDiscountVal,
            avgDiscountPerSale: avgDiscount,
            discountFrequency: frequency,
            topDiscountMethod: topMethod
        });

        setTrendData(processedTrendData);
        setDistributionData(processedDistData);
        setRecentDiscounts(topRecent);
    };

    const chartConfig = {
        Manual: { label: "Manual", color: "#f97316" },
        Percentage: { label: "Percentage", color: "#3b82f6" },
        Item: { label: "Item-level", color: "#10b981" },
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Discount Given"
                    value={`₦${metrics.totalDiscountGiven.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={NairaSign}
                    description="Last 6 months"
                    trend={{ value: 0, isPositive: true }} // TODO: Calculate trend
                    colorScheme="primary"
                />
                <MetricCard
                    title="Avg. Discount Value"
                    value={`₦${metrics.avgDiscountPerSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={TrendingDown}
                    description="Per discounted sale"
                    colorScheme="blue"
                />
                <MetricCard
                    title="Discount Frequency"
                    value={`${metrics.discountFrequency.toFixed(1)}%`}
                    icon={Percent}
                    description="Of all transactions"
                    colorScheme="violet"
                />
                <MetricCard
                    title="Top Method"
                    value={metrics.topDiscountMethod}
                    icon={Tag}
                    description="By value given"
                    colorScheme="orange"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Discount Trends (6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ChartContainer config={chartConfig}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorItem" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value}`} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend />
                                        <Area type="monotone" stackId="1" dataKey="Item" stroke="#10b981" fill="url(#colorItem)" />
                                        <Area type="monotone" stackId="1" dataKey="Percentage" stroke="#3b82f6" fill="url(#colorPercent)" />
                                        <Area type="monotone" stackId="1" dataKey="Manual" stroke="#f97316" fill="url(#colorManual)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Discount Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] flex items-center justify-center">
                            {distributionData.length > 0 ? (
                                <ChartContainer config={chartConfig} className="w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={distributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {distributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <ChartLegend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="text-center text-muted-foreground">No discount data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent High-Value Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Sale Total</TableHead>
                                <TableHead>Total Discount</TableHead>
                                <TableHead>Type Breakdown</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentDiscounts.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{format(parseISO(sale.date), "MMM d, yyyy h:mm a")}</TableCell>
                                    <TableCell>₦{Number(sale.total).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-red-500">-₦{sale.discountTotal.toLocaleString()}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {sale.breakdown.manual > 0 && <span className="mr-2 text-orange-600">Manual: ₦{sale.breakdown.manual.toLocaleString()}</span>}
                                        {sale.breakdown.percent > 0 && <span className="mr-2 text-blue-600">%: ₦{sale.breakdown.percent.toLocaleString()}</span>}
                                        {sale.breakdown.item > 0 && <span className="text-green-600">Item: ₦{sale.breakdown.item.toLocaleString()}</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentDiscounts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        No recent discounts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default DiscountReport;
