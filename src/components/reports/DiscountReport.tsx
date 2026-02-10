import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend
} from '@/components/ui/chart';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendingUp, TrendingDown, Percent, Tag } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { format, subMonths, parseISO } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';

import {
    ReportLayout,
    ReportFiltersBar,
    ReportSummaryCards,
    ReportChartPanel,
    ReportDataTable,
    ReportExportPanel
} from '@/components/reports/shared';
import type { MetricCardData, ColumnDef, ExportColumn } from '@/components/reports/shared';
import { useReportFilters } from '@/hooks/reports/useReportFilters';
import { useReportsSales, useReportBranches } from '@/hooks/reports/useReportsData';
import { Badge } from '@/components/ui/badge';

const DiscountReport = () => {
    // Initialize filters with persistence
    const { filters, setFilters } = useReportFilters('discount-report', {
        startDate: subMonths(new Date(), 6).toISOString(),
        endDate: new Date().toISOString(),
        branchIds: ['all']
    });

    // Fetch data
    const { data: branches = [] } = useReportBranches();
    const { data: rawSales, isLoading } = useReportsSales({
        startDate: filters.startDate || subMonths(new Date(), 6).toISOString(),
        endDate: filters.endDate || new Date().toISOString(),
        branchId: filters.branchIds?.[0] || 'all'
    });

    // Process data
    const processedData = useMemo(() => {
        if (!rawSales?.data) return {
            metrics: [],
            trendData: [],
            distributionData: [],
            recentDiscounts: [],
            exportData: []
        };

        let totalDiscountVal = 0;
        let totalSalesCount = rawSales.data.length;
        let salesWithDiscountCount = 0;

        let totalManualDiscount = 0;
        let totalPercentDiscount = 0;
        let totalItemDiscount = 0;

        const monthlyData: Record<string, { manual: number; percent: number; item: number; total: number }> = {};
        const recentDiscountedSales: any[] = [];

        rawSales.data.forEach(sale => {
            const monthKey = format(parseISO(sale.date), 'MMM yyyy');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { manual: 0, percent: 0, item: 0, total: 0 };
            }

            // 1. Manual Discount (Fixed Amount)
            const manualDisc = Number(sale.manual_discount) || 0;

            // 2. Item Level Discount
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

            // 3. Percentage Discount (Overall)
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
                recentDiscountedSales.push({
                    id: sale.id,
                    date: sale.date,
                    customer_name: sale.customer_name || 'Walk-in Customer',
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

        // Sort recent sales by date desc
        const topRecent = recentDiscountedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Prepare Chart Data
        const trendData = Object.entries(monthlyData).map(([month, values]) => ({
            month,
            Manual: values.manual,
            Percentage: values.percent,
            Item: values.item,
            Total: values.total
        }));

        // Distribution Data
        const distributionData = [
            { name: "Manual (Fixed)", value: totalManualDiscount, color: "#f97316" }, // orange
            { name: "Percentage (Overall)", value: totalPercentDiscount, color: "#3b82f6" }, // blue
            { name: "Item-level", value: totalItemDiscount, color: "#10b981" }, // green
        ].filter(d => d.value > 0);

        // Metrics
        const avgDiscount = salesWithDiscountCount > 0 ? totalDiscountVal / salesWithDiscountCount : 0;
        const frequency = totalSalesCount > 0 ? (salesWithDiscountCount / totalSalesCount) * 100 : 0;

        let topMethod = "None";
        const maxVal = Math.max(totalManualDiscount, totalPercentDiscount, totalItemDiscount);
        if (maxVal > 0) {
            if (maxVal === totalManualDiscount) topMethod = "Manual (Fixed)";
            else if (maxVal === totalPercentDiscount) topMethod = "Overall %";
            else topMethod = "Item-level";
        }

        // KPI Cards
        const metrics: MetricCardData[] = [
            {
                title: 'Total Discount Given',
                value: `₦${totalDiscountVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                icon: NairaSign,
                description: filters.startDate ? 'Selected period' : 'All time',
                colorScheme: 'primary'
            },
            {
                title: 'Avg. Discount Value',
                value: `₦${avgDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                icon: TrendingDown,
                description: 'Per discounted sale',
                colorScheme: 'blue'
            },
            {
                title: 'Discount Frequency',
                value: `${frequency.toFixed(1)}%`,
                icon: Percent,
                description: 'Of total transactions',
                colorScheme: 'violet'
            },
            {
                title: 'Top Method',
                value: topMethod,
                icon: Tag,
                description: 'By value given',
                colorScheme: 'orange'
            }
        ];

        // Export Data
        const exportData = recentDiscountedSales.map(sale => ({
            date: format(parseISO(sale.date), 'yyyy-MM-dd HH:mm'),
            customer: sale.customer_name,
            total: sale.total,
            discount: sale.discountTotal,
            manual: sale.breakdown.manual,
            percent: sale.breakdown.percent,
            item: sale.breakdown.item
        }));

        return {
            metrics,
            trendData,
            distributionData,
            recentDiscounts: topRecent,
            exportData
        };
    }, [rawSales?.data, filters.startDate]);

    const chartConfig = {
        Manual: { label: "Manual", color: "#f97316" },
        Percentage: { label: "Percentage", color: "#3b82f6" },
        Item: { label: "Item-level", color: "#10b981" },
    };

    const columns: ColumnDef<any>[] = [
        {
            key: 'date',
            header: 'Date',
            cell: (item) => format(parseISO(item.date), 'MMM d, h:mm a')
        },
        {
            key: 'customer_name',
            header: 'Customer',
            cell: (item) => item.customer_name
        },
        {
            key: 'total',
            header: 'Sale Total',
            cell: (item) => `₦${Number(item.total).toLocaleString()}`
        },
        {
            key: 'discountTotal',
            header: 'Discount Amount',
            cell: (item) => <span className="font-bold text-orange-600">₦${Number(item.discountTotal).toLocaleString()}</span>
        },
        {
            key: 'breakdown',
            header: 'Breakdown',
            cell: (item) => (
                <div className="flex gap-1 text-[10px]">
                    {item.breakdown.manual > 0 && <Badge variant="outline" className="text-orange-600 border-orange-200">Manual: ₦{item.breakdown.manual}</Badge>}
                    {item.breakdown.percent > 0 && <Badge variant="outline" className="text-blue-600 border-blue-200">Percent: ₦{item.breakdown.percent}</Badge>}
                    {item.breakdown.item > 0 && <Badge variant="outline" className="text-emerald-600 border-emerald-200">Item: ₦{item.breakdown.item}</Badge>}
                </div>
            )
        }
    ];

    const exportColumns: ExportColumn[] = [
        { key: 'date', header: 'Date' },
        { key: 'customer', header: 'Customer' },
        { key: 'total', header: 'Total (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'discount', header: 'Discount (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'manual', header: 'Manual (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'percent', header: 'Percent (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'item', header: 'Item (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` }
    ];

    return (
        <ReportLayout
            title="Discount Report"
            description="Analysis of discounts given across sales"
            icon={Tag}
            isLoading={isLoading}
            emptyState={processedData.recentDiscounts.length === 0 ? undefined : undefined}
        >
            <ReportFiltersBar
                reportId="discount-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    dateRange: true,
                    branch: true
                }}
                branches={branches}
            />

            <ReportSummaryCards metrics={processedData.metrics} />

            <div className="grid gap-6 lg:grid-cols-3">
                <ReportChartPanel
                    title="Discount Trends"
                    description="Discount value over time by type"
                    chartType="area"
                    className="lg:col-span-2"
                >
                    <ChartContainer config={chartConfig}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedData.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                </ReportChartPanel>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Discount Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            {processedData.distributionData.length > 0 ? (
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={processedData.distributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {processedData.distributionData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <ChartLegend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="text-center text-muted-foreground text-sm">No discount data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ReportDataTable
                columns={columns}
                data={processedData.recentDiscounts}
                pageSize={10}
                title="Recent High-Value Discounts"
            />

            <ReportExportPanel
                reportName="Discount Report"
                data={processedData.exportData}
                columns={exportColumns}
                filters={filters}
                formats={['csv', 'print']}
            />

        </ReportLayout>
    );
};

export default DiscountReport;
