import { useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, Wallet, Receipt, PieChart as PieChartIcon } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ReportLayout,
    ReportFiltersBar,
    ReportSummaryCards,
    ReportChartPanel,
    ReportExportPanel
} from '@/components/reports/shared';
import type { MetricCardData, ExportColumn } from '@/components/reports/shared';
import { useReportFilters } from '@/hooks/reports/useReportFilters';
import { useReportsSales, useReportsExpenses, useReportBranches } from '@/hooks/reports/useReportsData';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ProfitAndLossReport = () => {
    // Initialize filters with persistence
    const { filters, setFilters } = useReportFilters('pnl-report', {
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        branchIds: ['all']
    });

    // Fetch data using shared hooks
    const { data: branches = [] } = useReportBranches();
    const { data: sales, isLoading: salesLoading } = useReportsSales({
        startDate: filters.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: filters.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        branchId: filters.branchIds?.[0] || 'all'
    });
    const { data: expenses, isLoading: expensesLoading } = useReportsExpenses({
        startDate: filters.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: filters.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        branchId: filters.branchIds?.[0] || 'all'
    });

    const loading = salesLoading || expensesLoading;

    // Calculate P&L data (FINANCIAL LOGIC - DO NOT MODIFY)
    const { data, chartData, pieData, exportData, statementData } = useMemo(() => {
        if (!sales?.data || !expenses) return {
            data: {
                revenue: 0,
                cogs: 0,
                grossProfit: 0,
                expenses: 0,
                netProfit: 0,
                expenseBreakdown: [],
                branchDistribution: []
            },
            chartData: [],
            pieData: [],
            exportData: [],
            statementData: []
        };

        let revenue = 0;
        let cogs = 0;
        const branchRevMap: Record<string, number> = {};

        sales.data.forEach(sale => {
            const saleTotal = Number(sale.total);
            revenue += saleTotal;

            const branchName = (sale as any).branches?.name || 'Main Branch';
            branchRevMap[branchName] = (branchRevMap[branchName] || 0) + saleTotal;

            sale.sales_items?.forEach((item: any) => {
                cogs += (Number(item.cost_price) || 0) * Number(item.quantity);
            });
        });

        let totalExpensesCount = 0;
        const breakdownMap: Record<string, number> = {};

        expenses.forEach(exp => {
            const amount = Number(exp.amount);
            totalExpensesCount += amount;
            breakdownMap[exp.category] = (breakdownMap[exp.category] || 0) + amount;
        });

        const sortedBreakdown = Object.entries(breakdownMap)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        const branchDistribution = Object.entries(branchRevMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - totalExpensesCount;

        // Prepare chart data
        const processedChartData = [
            { name: 'Revenue', value: revenue },
            { name: 'COGS', value: cogs },
            { name: 'Gross Profit', value: grossProfit },
            { name: 'Expenses', value: totalExpensesCount },
            { name: 'Net Profit', value: netProfit },
        ];

        // Prepare export data
        const exportRows = [
            { Item: 'Total Sales Revenue', Amount: revenue, Percentage: '100%' },
            { Item: 'Cost of Goods Sold (COGS)', Amount: -cogs, Percentage: revenue > 0 ? `${((cogs / revenue) * 100).toFixed(1)}%` : '0%' },
            { Item: 'GROSS PROFIT', Amount: grossProfit, Percentage: revenue > 0 ? `${((grossProfit / revenue) * 100).toFixed(1)}%` : '0%' },
            ...sortedBreakdown.map(e => ({
                Item: `Expense: ${e.category}`,
                Amount: -e.amount,
                Percentage: revenue > 0 ? `${((e.amount / revenue) * 100).toFixed(1)}%` : '0%'
            })),
            { Item: 'Total Operating Expenses', Amount: -totalExpensesCount, Percentage: revenue > 0 ? `${((totalExpensesCount / revenue) * 100).toFixed(1)}%` : '0%' },
            { Item: 'NET PROFIT / LOSS', Amount: netProfit, Percentage: revenue > 0 ? `${((netProfit / revenue) * 100).toFixed(1)}%` : '0%' }
        ];

        // Prepare statement data for table
        const statementRows = [
            { type: 'revenue', label: 'Total Sales Revenue', amount: revenue, percentage: 100 },
            { type: 'expense', label: 'Less: Cost of Goods Sold (COGS)', amount: cogs, percentage: revenue > 0 ? (cogs / revenue) * 100 : 0 },
            { type: 'subtotal', label: 'GROSS PROFIT', amount: grossProfit, percentage: revenue > 0 ? (grossProfit / revenue) * 100 : 0 },
            ...sortedBreakdown.map(exp => ({
                type: 'expense-item' as const,
                label: exp.category,
                amount: exp.amount,
                percentage: revenue > 0 ? (exp.amount / revenue) * 100 : 0
            })),
            { type: 'expense-total', label: 'Total Operating Expenses', amount: totalExpensesCount, percentage: revenue > 0 ? (totalExpensesCount / revenue) * 100 : 0 },
            { type: 'final', label: 'NET PROFIT / LOSS', amount: netProfit, percentage: revenue > 0 ? (netProfit / revenue) * 100 : 0 }
        ];

        // Prepare metrics for summary cards
        const metricsData: MetricCardData[] = [
            {
                title: 'Total Revenue',
                value: `₦${revenue.toLocaleString()}`,
                icon: TrendingUp,
                colorScheme: 'primary'
            },
            {
                title: 'Gross Profit',
                value: `₦${grossProfit.toLocaleString()}`,
                icon: Receipt,
                colorScheme: 'success'
            },
            {
                title: 'Total Expenses',
                value: `₦${totalExpensesCount.toLocaleString()}`,
                icon: Wallet,
                colorScheme: 'orange'
            },
            {
                title: 'Net Profit',
                value: `₦${netProfit.toLocaleString()}`,
                icon: netProfit >= 0 ? TrendingUp : TrendingDown,
                colorScheme: netProfit >= 0 ? 'success' : 'orange'
            }
        ];

        return {
            data: {
                revenue,
                cogs,
                grossProfit,
                expenses: totalExpensesCount,
                netProfit,
                expenseBreakdown: sortedBreakdown,
                branchDistribution
            },
            metrics: metricsData,
            chartData: processedChartData,
            pieData: branchDistribution,
            exportData: exportRows,
            statementData: statementRows
        };
    }, [sales?.data, expenses]);

    const exportColumns: ExportColumn[] = [
        { key: 'Item', header: 'Item' },
        { key: 'Amount', header: 'Amount (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'Percentage', header: '% of Revenue' }
    ];

    return (
        <ReportLayout
            title="Profit & Loss Statement"
            description="Comprehensive financial performance analysis"
            icon={Calculator}
            isLoading={loading}
        >
            {/* Filters */}
            <ReportFiltersBar
                reportId="pnl-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    dateRange: true,
                    branch: true
                }}
                branches={branches}
            />

            {/* Summary Cards */}
            <ReportSummaryCards metrics={data.metrics} isLoading={loading} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Overview Chart */}
                <ReportChartPanel
                    title="Financial Overview"
                    description="Visual breakdown of business performance"
                    chartType="bar"
                    defaultExpanded={true}
                    className="lg:col-span-2"
                >
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
                </ReportChartPanel>

                {/* Branch Contribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChartIcon className="h-5 w-5 text-blue-500" />
                            Branch Contribution
                        </CardTitle>
                        <CardDescription>Revenue by location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <div className="space-y-4">
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    {pieData.map((item, index) => (
                                        <div key={item.name} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }} />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <span className="text-muted-foreground">₦{item.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs italic">
                                No branch data available.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* P&L Statement Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-md">Statement of Profit and Loss</CardTitle>
                    <CardDescription>Detailed accounting for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableBody>
                            {/* Header Row */}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell>PARTICULARS</TableCell>
                                <TableCell className="text-right">AMOUNT (₦)</TableCell>
                                <TableCell className="text-right">% OF REVENUE</TableCell>
                            </TableRow>

                            {/* Statement Rows */}
                            {statementData.map((row, index) => {
                                if (row.type === 'revenue') {
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="pl-6">{row.label}</TableCell>
                                            <TableCell className="text-right">{row.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{row.percentage.toFixed(0)}%</TableCell>
                                        </TableRow>
                                    );
                                }
                                if (row.type === 'expense') {
                                    return (
                                        <TableRow key={index} className="text-rose-600">
                                            <TableCell className="pl-6">{row.label}</TableCell>
                                            <TableCell className="text-right">({row.amount.toLocaleString()})</TableCell>
                                            <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                }
                                if (row.type === 'subtotal') {
                                    return (
                                        <>
                                            <TableRow key={`sep-${index}`}>
                                                <TableCell colSpan={3}><Separator /></TableCell>
                                            </TableRow>
                                            <TableRow key={index} className="font-bold bg-primary/5 text-primary">
                                                <TableCell>{row.label}</TableCell>
                                                <TableCell className="text-right">{row.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                                            </TableRow>
                                            <TableRow key={`opex-${index}`} className="bg-muted/30 font-semibold italic">
                                                <TableCell colSpan={3}>Operating Expenses (OPEX)</TableCell>
                                            </TableRow>
                                        </>
                                    );
                                }
                                if (row.type === 'expense-item') {
                                    return (
                                        <TableRow key={index} className="text-muted-foreground">
                                            <TableCell className="pl-8">{row.label}</TableCell>
                                            <TableCell className="text-right">({row.amount.toLocaleString()})</TableCell>
                                            <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                }
                                if (row.type === 'expense-total') {
                                    return (
                                        <TableRow key={index} className="font-semibold text-rose-600">
                                            <TableCell className="pl-6 font-bold">{row.label}</TableCell>
                                            <TableCell className="text-right">({row.amount.toLocaleString()})</TableCell>
                                            <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                }
                                if (row.type === 'final') {
                                    return (
                                        <TableRow key={index} className={`font-bold text-lg ${row.amount >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                            <TableCell>{row.label}</TableCell>
                                            <TableCell className="text-right">{row.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                }
                                return null;
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Export Panel */}
            <ReportExportPanel
                reportName="Profit and Loss Statement"
                data={exportData}
                columns={exportColumns}
                filters={filters}
                formats={['csv', 'print']}
            />
        </ReportLayout>
    );
};

export default ProfitAndLossReport;
