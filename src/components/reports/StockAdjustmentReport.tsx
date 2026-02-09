import { useMemo } from "react";
import {
    RefreshCcw,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    TrendingDown,
    TrendingUp,
    User,
    AlertCircle
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { NairaSign } from "@/components/icons/NairaSign";
import { formatCurrency } from "@/lib/currency";

import {
    ReportLayout,
    ReportFiltersBar,
    ReportSummaryCards,
    ReportChartPanel,
    ReportDataTable,
    ReportExportPanel
} from "@/components/reports/shared";
import type { MetricCardData, ColumnDef, ExportColumn } from "@/components/reports/shared";
import { useReportFilters } from "@/hooks/reports/useReportFilters";
import { useReportsStockAdjustments } from "@/hooks/reports/useReportsStock";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";

const StockAdjustmentReport = () => {
    // Filters
    const { filters, setFilters } = useReportFilters('stock-adjustment-report', {
        startDate: subDays(new Date(), 30).toISOString(),
        endDate: new Date().toISOString(),
        searchQuery: ''
    });

    // Data Fetching
    const { data: adjustments = [], isLoading } = useReportsStockAdjustments({
        startDate: filters.startDate || subDays(new Date(), 30).toISOString(),
        endDate: filters.endDate || new Date().toISOString(),
        searchQuery: filters.searchQuery
    });

    // Process Data
    const processedData = useMemo(() => {
        const stats = adjustments.reduce((acc, curr) => {
            const qtyChange = curr.quantity_change;
            const costPrice = curr.cost_price_at_time || 0;
            const sellPrice = curr.unit_price_at_time || 0;

            const costImpact = qtyChange * costPrice;
            const sellImpact = qtyChange * sellPrice;

            acc.totalCostImpact += costImpact;
            acc.totalSellImpact += sellImpact;
            if (qtyChange > 0) acc.increases += 1;
            else acc.decreases += 1;

            // Group by date for chart
            const dateKey = format(new Date(curr.created_at), 'yyyy-MM-dd');
            if (!acc.chartData[dateKey]) {
                acc.chartData[dateKey] = { date: dateKey, additions: 0, removals: 0 };
            }
            if (qtyChange > 0) acc.chartData[dateKey].additions += Math.abs(costImpact);
            else acc.chartData[dateKey].removals += Math.abs(costImpact);

            return acc;
        }, {
            totalCostImpact: 0,
            totalSellImpact: 0,
            increases: 0,
            decreases: 0,
            chartData: {} as Record<string, any>
        });

        return {
            ...stats,
            chartDataArray: Object.values(stats.chartData).sort((a: any, b: any) => new Date(a.date).getTime() - b.date).slice(-14) // Last 14 days with activity
        };
    }, [adjustments]);

    // Metrics Configuration
    const metrics: MetricCardData[] = [
        {
            title: 'Total Adjustments',
            value: adjustments.length,
            icon: RefreshCcw,
            description: `${processedData.increases} Inc / ${processedData.decreases} Dec`,
            colorScheme: 'blue'
        },
        {
            title: 'Cost Impact',
            value: formatCurrency(processedData.totalCostImpact),
            icon: TrendingDown,
            description: 'Net inventory value diff',
            colorScheme: processedData.totalCostImpact >= 0 ? 'success' : 'rose'
        },
        {
            title: 'Potential Revenue',
            value: formatCurrency(processedData.totalSellImpact),
            icon: TrendingUp,
            description: 'Sales value difference',
            colorScheme: processedData.totalSellImpact >= 0 ? 'success' : 'rose'
        },
        {
            title: 'Net Value Diff',
            value: formatCurrency(processedData.totalSellImpact - processedData.totalCostImpact),
            icon: NairaSign,
            description: 'Profit/Loss projection',
            colorScheme: 'violet'
        }
    ];

    // Table Columns
    const columns: ColumnDef<any>[] = [
        {
            key: 'created_at',
            header: 'Date',
            cell: (row) => format(new Date(row.created_at), 'MMM dd, HH:mm')
        },
        {
            key: 'product',
            header: 'Product',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.inventory.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.inventory.sku}</span>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            cell: (row) => {
                const qtychange = row.quantity_change;
                switch (row.type) {
                    case 'ADDITION': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ArrowUpRight className="h-3 w-3 mr-1" /> Addition</Badge>;
                    case 'RETURN': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><ArrowDownRight className="h-3 w-3 mr-1" /> Return</Badge>;
                    case 'INITIAL': return <Badge variant="secondary"><Info className="h-3 w-3 mr-1" /> Initial</Badge>;
                    default: return <Badge variant="outline" className={qtychange > 0 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-orange-700 bg-orange-50 border-orange-200"}>
                        <RefreshCcw className="h-3 w-3 mr-1" /> Adj {qtychange > 0 ? '(+)' : '(-)'}
                    </Badge>;
                }
            }
        },
        {
            key: 'quantity_change',
            header: 'Qty Diff',
            cell: (row) => (
                <span className={`font-bold ${row.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.quantity_change > 0 ? '+' : ''}{row.quantity_change}
                </span>
            )
        },
        {
            key: 'impact',
            header: 'Cost Imact',
            cell: (row) => {
                const val = row.quantity_change * (row.cost_price_at_time || 0);
                return <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(val)}</span>;
            }
        },
        {
            key: 'user',
            header: 'User',
            cell: (row) => <div className="flex items-center gap-1 text-xs"><User className="h-3 w-3" />{row.profiles?.name || 'System'}</div>
        },
        {
            key: 'reason',
            header: 'Reason',
            cell: (row) => <span className="text-xs italic text-muted-foreground truncate max-w-[150px]" title={row.reason}>{row.reason || '-'}</span>
        }
    ];

    // Export Data
    const exportData = adjustments.map(row => ({
        date: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm'),
        product: row.inventory.name,
        sku: row.inventory.sku,
        type: row.type,
        qty_change: row.quantity_change,
        old_qty: row.previous_quantity,
        new_qty: row.new_quantity,
        cost_impact: row.quantity_change * (row.cost_price_at_time || 0),
        user: row.profiles?.name || 'System',
        reason: row.reason
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'date', header: 'Date' },
        { key: 'product', header: 'Product' },
        { key: 'sku', header: 'SKU' },
        { key: 'type', header: 'Type' },
        { key: 'qty_change', header: 'Qty Change' },
        { key: 'new_qty', header: 'New Qty' },
        { key: 'cost_impact', header: 'Cost Impact (₦)', formatter: (val) => formatCurrency(Number(val)) },
        { key: 'user', header: 'User' },
        { key: 'reason', header: 'Reason' }
    ];

    return (
        <ReportLayout
            title="Stock Advertisements Report"
            description="Track inventory changes, audits, and value adjustments"
            icon={RefreshCcw}
            isLoading={isLoading}
            emptyState={adjustments.length === 0 ? (
                <div className="text-center py-10">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p>No stock adjustments found</p>
                </div>
            ) : undefined}
            onRefresh={() => window.location.reload()} // Simplified refresh as hook handles it
        >
            <ReportFiltersBar
                reportId="stock-adjustment-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    dateRange: true,
                    search: true
                }}
            />

            <ReportSummaryCards metrics={metrics} />

            <ReportChartPanel
                title="Adjustment Trends (Cost Value)"
                description="Daily value of additions vs removals/returns"
                chartType="bar"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.chartDataArray}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                            fontSize={12}
                        />
                        <YAxis tickFormatter={(val) => `₦${val / 1000}k`} fontSize={12} />
                        <Tooltip
                            formatter={(val: number) => formatCurrency(val)}
                            labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                        />
                        <Legend />
                        <Bar dataKey="additions" name="Additions (Value)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="removals" name="Reductions (Value)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ReportChartPanel>

            <ReportDataTable
                columns={columns}
                data={adjustments}
                pageSize={20}
            />

            <ReportExportPanel
                reportName="Stock Adjustment Report"
                data={exportData}
                columns={exportColumns}
                filters={filters}
                formats={['csv', 'print']}
            />
        </ReportLayout>
    );
};

export default StockAdjustmentReport;
