import { useMemo, useState } from "react";
import {
    RefreshCcw,
    TrendingDown,
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
import { useReportsStockAdjustments, useReportsStockAdjustmentStats } from "@/hooks/reports/useReportsStock";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const StockAdjustmentReport = () => {
    const { user } = useAuth();
    const canViewFinancials = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    // Filters
    const { filters, setFilters } = useReportFilters('stock-adjustment-report', {
        startDate: subDays(new Date(), 30).toISOString(),
        endDate: new Date().toISOString(),
        searchQuery: ''
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const handleFiltersChange = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1);
    };

    // Data Fetching
    const { data: listData, isLoading: loadingList } = useReportsStockAdjustments({
        startDate: filters.startDate!,
        endDate: filters.endDate!,
        searchQuery: filters.searchQuery,
        page,
        pageSize
    });

    const { data: statsData = [], isLoading: loadingStats } = useReportsStockAdjustmentStats({
        startDate: filters.startDate!,
        endDate: filters.endDate!
    });

    // Process Stats
    const processedStats = useMemo(() => {
        const stats = statsData.reduce((acc: any, curr: any) => {
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
            chartDataArray: Object.values(stats.chartData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };
    }, [statsData]);

    const adjustments = listData?.data || [];
    const totalCount = listData?.count || 0;

    // Metrics Configuration
    const metrics: MetricCardData[] = [
        {
            title: 'Total Adjustments',
            value: totalCount.toString(),
            icon: RefreshCcw,
            description: `${processedStats.increases} Inc / ${processedStats.decreases} Dec (Global)`,
            colorScheme: 'blue'
        },
        {
            title: 'Cost Impact',
            value: canViewFinancials ? formatCurrency(processedStats.totalCostImpact) : '********',
            icon: TrendingDown,
            description: canViewFinancials ? 'Net inventory value diff' : 'Hidden for your role',
            colorScheme: processedStats.totalCostImpact >= 0 ? 'success' : 'rose'
        }
    ];

    // Columns
    const columns: ColumnDef<any>[] = [
        {
            key: 'date',
            header: 'Date',
            cell: (row) => <span className="text-xs font-mono">{format(new Date(row.created_at), 'MMM dd, HH:mm')}</span>
        },
        {
            key: 'product',
            header: 'Product',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.inventory?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{row.inventory?.sku || '-'}</span>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            cell: (row) => <Badge variant="outline" className="text-[10px]">{row.type}</Badge>
        },
        {
            key: 'change',
            header: 'Change',
            cell: (row) => (
                <span className={`font-bold ${row.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.quantity_change > 0 ? '+' : ''}{row.quantity_change}
                </span>
            )
        },
        {
            key: 'impact',
            header: 'Cost Value',
            cell: (row) => {
                const impact = row.quantity_change * (row.cost_price_at_time || 0);
                return <span className={`text-xs ${impact > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(impact)}</span>;
            },
            roleRestriction: ['SUPER_ADMIN', 'ADMIN']
        },
        {
            key: 'reason',
            header: 'Reason',
            cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{row.reason || '-'}</span>
        },
        {
            key: 'user',
            header: 'User',
            cell: (row) => <span className="text-xs">{row.profiles?.name || 'Unknown'}</span>
        }
    ];

    const exportColumns: ExportColumn[] = [
        { key: 'date', header: 'Date' },
        { key: 'product', header: 'Product' },
        { key: 'type', header: 'Type' },
        { key: 'change', header: 'Qty Change' },
        { key: 'reason', header: 'Reason' },
        { key: 'user', header: 'User' }
    ];

    if (canViewFinancials) {
        exportColumns.splice(4, 0, { key: 'impact', header: 'Cost Value', formatter: (val) => formatCurrency(Number(val)) });
    }

    const exportData = adjustments.map(row => {
        const base = {
            date: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm'),
            product: row.inventory?.name,
            type: row.type,
            change: row.quantity_change,
            reason: row.reason,
            user: row.profiles?.name
        };
        if (canViewFinancials) {
            return {
                ...base,
                impact: row.quantity_change * (row.cost_price_at_time || 0)
            };
        }
        return base;
    });

    return (
        <ReportLayout
            title="Stock Adjustment Log"
            description="Track manual inventory corrections and damages"
            icon={RefreshCcw}
            isLoading={loadingList || loadingStats}
            onRefresh={() => window.location.reload()}
        >
            <ReportFiltersBar
                reportId="stock-adjustment-report"
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableFilters={{
                    dateRange: true,
                    search: true
                }}
            />

            <ReportSummaryCards metrics={metrics} />

            {canViewFinancials && (
                <ReportChartPanel title="Adjustment Trends" description="Cost value of adjustments over time" chartType="bar">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedStats.chartDataArray}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(val) => format(parseISO(val), 'MMM dd')} fontSize={12} />
                            <YAxis tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} fontSize={12} />
                            <Tooltip formatter={(val: number) => formatCurrency(val)} labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')} />
                            <Legend />
                            <Bar dataKey="additions" name="Value Added" fill="#22c55e" stackId="a" />
                            <Bar dataKey="removals" name="Value Removed" fill="#ef4444" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </ReportChartPanel>
            )}

            <ReportDataTable
                columns={columns}
                data={adjustments}
                totalRows={totalCount}
                pageSize={pageSize}
                currentPage={page}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
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
