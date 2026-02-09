import {
    Star,
    Target,
    ShoppingBag,
    AlertTriangle,
    ShieldCheck,
    TrendingUp
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useReportsStaffPerformance } from "@/hooks/reports/useReportsStaff";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis } from "recharts";
import { useReportBranches } from "@/hooks/reports/useReportsData";

const StaffPerformanceReport = () => {
    // Filters
    const { filters, setFilters } = useReportFilters('staff-performance-report', {
        startDate: subDays(new Date(), 30).toISOString(),
        endDate: new Date().toISOString(),
        branchIds: ['all']
    });

    // Data Fetching
    const { data: branches = [] } = useReportBranches();
    const { data: staffStats, isLoading } = useReportsStaffPerformance({
        startDate: filters.startDate!,
        endDate: filters.endDate!,
        branchId: filters.branchIds?.[0] || 'all'
    });

    // Metrics Configuration
    const topPerformer = staffStats[0];
    const avgATV = staffStats.length > 0
        ? staffStats.reduce((a, b) => a + b.avgTransactionValue, 0) / staffStats.length
        : 0;
    const highRiskStaff = staffStats.filter(s => s.varianceFrequency > 20).length;

    const metrics: MetricCardData[] = [
        {
            title: 'Top Performer',
            value: topPerformer?.name || "N/A",
            icon: Target,
            description: topPerformer ? formatCurrency(topPerformer.totalSales) : "No data",
            colorScheme: 'success'
        },
        {
            title: 'Avg Team ATV',
            value: formatCurrency(avgATV),
            icon: ShoppingBag,
            description: 'Average Ticket Value',
            colorScheme: 'blue'
        },
        {
            title: 'Accuracy Alert',
            value: highRiskStaff.toString(),
            icon: AlertTriangle,
            description: 'Staff with >20% variance freq',
            colorScheme: highRiskStaff > 0 ? 'rose' : 'success'
        },
        {
            title: 'Total Shifts',
            value: staffStats.reduce((a, b) => a + b.shiftsCount, 0).toString(),
            icon: ShieldCheck,
            description: 'Shifts analyzed',
            colorScheme: 'violet'
        }
    ];

    // Table Columns
    const columns: ColumnDef<any>[] = [
        {
            key: 'name',
            header: 'Staff Member',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground">{row.shiftsCount} shifts completed</span>
                </div>
            )
        },
        {
            key: 'totalSales',
            header: 'Total Sales',
            cell: (row) => <span className="font-medium">{formatCurrency(row.totalSales)}</span>
        },
        {
            key: 'avgTransactionValue',
            header: 'ATV',
            cell: (row) => <span className="text-xs">{formatCurrency(row.avgTransactionValue)}</span>
        },
        {
            key: 'netVariance',
            header: 'Net Variance',
            cell: (row) => (
                <span className={`font-bold ${row.netVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {row.netVariance > 0 ? '+' : ''}{formatCurrency(row.netVariance)}
                </span>
            )
        },
        {
            key: 'accuracy',
            header: 'Accuracy Score',
            cell: (row) => (
                <div className="flex flex-col gap-1 w-[100px]">
                    <div className="flex justify-between text-xs">
                        <span className={row.accuracyScore > 80 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                            {row.accuracyScore.toFixed(1)}%
                        </span>
                    </div>
                    <Progress value={row.accuracyScore} className="h-1.5" />
                </div>
            )
        },
        {
            key: 'status',
            header: 'Rating',
            cell: (row) => {
                if (row.accuracyScore > 95) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Elite</Badge>;
                if (row.accuracyScore > 85) return <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px]">Reliable</Badge>;
                return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Review</Badge>;
            }
        }
    ];

    // Export Data
    const exportData = staffStats.map(row => ({
        name: row.name,
        shifts: row.shiftsCount,
        sales: row.totalSales,
        transactions: row.transactionCount,
        atv: row.avgTransactionValue,
        variance: row.netVariance,
        accuracy: row.accuracyScore,
        rating: row.accuracyScore > 95 ? 'Elite' : row.accuracyScore > 85 ? 'Reliable' : 'Review Required'
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'name', header: 'Staff Name' },
        { key: 'shifts', header: 'Shifts' },
        { key: 'sales', header: 'Sales (₦)', formatter: (val) => formatCurrency(Number(val)) },
        { key: 'atv', header: 'ATV (₦)', formatter: (val) => formatCurrency(Number(val)) },
        { key: 'variance', header: 'Variance (₦)', formatter: (val) => formatCurrency(Number(val)) },
        { key: 'accuracy', header: 'Accuracy %', formatter: (val) => Number(val).toFixed(2) + '%' },
        { key: 'rating', header: 'Rating' }
    ];

    return (
        <ReportLayout
            title="Staff Efficiency & Accuracy Analytics"
            description="Identifying performance trends and training opportunities"
            icon={Star}
            isLoading={isLoading}
            emptyState={staffStats.length === 0 ? undefined : undefined}
        >
            <ReportFiltersBar
                reportId="staff-performance-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    dateRange: true,
                    branch: true
                }}
                branches={branches}
            />

            <ReportSummaryCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportChartPanel
                    title="Variance vs Performance Matrix"
                    description="X: Sales Vol, Y: Cash Variance"
                    chartType="scatter"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="totalSales" name="Sales Vol" unit="₦" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} fontSize={12} />
                            <YAxis type="number" dataKey="netVariance" name="Variance" unit="₦" fontSize={12} />
                            <ZAxis type="number" range={[50, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val: number) => formatCurrency(val)} />
                            <Scatter name="Staff" data={staffStats} fill="#2563eb" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ReportChartPanel>

                <ReportChartPanel
                    title="Efficiency Ranking"
                    description="Staff ordered by Sales Volume"
                    chartType="bar"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={staffStats} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} fontSize={10} />
                            <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} />
                            <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            <Bar dataKey="totalSales" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ReportChartPanel>
            </div>

            <ReportDataTable
                columns={columns}
                data={staffStats}
                pageSize={20}
                title="Performance Ranking"
            />

            <ReportExportPanel
                reportName="Staff Performance Report"
                data={exportData}
                columns={exportColumns}
                filters={filters}
                formats={['csv', 'print']}
            />
        </ReportLayout>
    );
};

export default StaffPerformanceReport;
