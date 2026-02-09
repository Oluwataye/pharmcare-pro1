import { useState, useMemo, useEffect } from "react";
import {
    Target,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Target as TargetIcon
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets } from "@/hooks/useBudgets";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
import { useReportBranches } from "@/hooks/reports/useReportsData";

const BudgetVsActual = () => {
    const [loading, setLoading] = useState(true);

    // Use unified filters hook - treating startDate as the month selection anchor
    const { filters, setFilters } = useReportFilters('budget-report', {
        startDate: format(new Date(), 'yyyy-MM-dd'), // Used to derive month/year
        branchIds: ['all']
    });

    const { data: branches = [] } = useReportBranches();
    const { budgets, fetchBudgets, isLoading: budgetsLoading } = useBudgets();
    const [actuals, setActuals] = useState<Record<string, number>>({});

    // Derived state for month/year
    const date = useMemo(() => filters.startDate ? new Date(filters.startDate) : new Date(), [filters.startDate]);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const selectedBranch = filters.branchIds?.[0] || 'all';

    // Fetch data
    useEffect(() => {
        fetchBudgets(year, month, selectedBranch === 'all' ? undefined : selectedBranch);
        fetchActuals();
    }, [year, month, selectedBranch]);

    const fetchActuals = async () => {
        try {
            setLoading(true);
            const start = format(startOfMonth(date), 'yyyy-MM-dd');
            const end = format(endOfMonth(date), 'yyyy-MM-dd');

            // Fetch Sales for Revenue
            let salesQuery = supabase
                .from('sales' as any)
                .select('total')
                .gte('date', start)
                .lte('date', end);

            if (selectedBranch !== 'all') {
                salesQuery = salesQuery.eq('branch_id', selectedBranch);
            }

            const { data: sales } = await salesQuery;
            const totalRevenue = (sales || []).reduce((acc: number, s: any) => acc + Number(s.total), 0);

            // Fetch Expenses
            let expensesQuery = supabase
                .from('expenses' as any)
                .select('amount, category')
                .gte('date', start)
                .lte('date', end);

            if (selectedBranch !== 'all') {
                expensesQuery = expensesQuery.eq('branch_id', selectedBranch);
            }

            const { data: expenses } = await expensesQuery;
            const expenseMap: Record<string, number> = {};
            (expenses || []).forEach((e: any) => {
                expenseMap[e.category] = (expenseMap[e.category] || 0) + Number(e.amount);
            });

            setActuals({
                'Revenue': totalRevenue,
                ...expenseMap
            });
        } catch (error) {
            console.error("Error fetching actuals:", error);
        } finally {
            setLoading(false);
        }
    };

    // Process data for display
    const comparisonData = useMemo(() => {
        return budgets.map(b => {
            const actual = actuals[b.category] || 0;
            const variance = actual - b.amount;
            const variancePercent = b.amount > 0 ? (variance / b.amount) * 100 : 0;

            const isRevenue = b.category === 'Revenue';
            const onTrack = isRevenue
                ? actual >= b.amount // Revenue: higher is better
                : actual <= b.amount; // Expenses: lower is better

            return {
                category: b.category,
                budget: b.amount,
                actual: actual,
                variance,
                variancePercent,
                status: onTrack ? 'on-track' : (isRevenue ? 'below-target' : 'over-budget'),
                isRevenue
            };
        }).sort((a, b) => {
            if (a.category === 'Revenue') return -1;
            if (b.category === 'Revenue') return 1;
            return b.budget - a.budget;
        });
    }, [budgets, actuals]);

    const overallPerformance = useMemo(() => {
        const onTrackCount = comparisonData.filter(i => i.status === 'on-track').length;
        const totalCount = comparisonData.length;
        const percentage = totalCount > 0 ? (onTrackCount / totalCount) * 100 : 0;

        const totalBudget = comparisonData.reduce((acc, curr) => acc + curr.budget, 0);
        const totalActual = comparisonData.reduce((acc, curr) => acc + curr.actual, 0);

        return {
            score: percentage,
            totalBudget,
            totalActual
        };
    }, [comparisonData]);

    // Shared Components Configuration

    // 1. KPIs
    const metrics: MetricCardData[] = [
        {
            title: 'Budget Adherence',
            value: `${overallPerformance.score.toFixed(0)}%`,
            icon: Target,
            description: `${comparisonData.filter(i => i.status === 'on-track').length} / ${comparisonData.length} categories on track`,
            colorScheme: overallPerformance.score > 80 ? 'success' : overallPerformance.score > 50 ? 'warning' : 'rose'
        },
        {
            title: 'Total Budget',
            value: `₦${overallPerformance.totalBudget.toLocaleString()}`,
            icon: TargetIcon, // Using generic Target icon
            colorScheme: 'blue'
        },
        {
            title: 'Total Actual',
            value: `₦${overallPerformance.totalActual.toLocaleString()}`,
            icon: overallPerformance.totalActual <= overallPerformance.totalBudget ? TrendingDown : TrendingUp,
            colorScheme: overallPerformance.totalActual <= overallPerformance.totalBudget ? 'success' : 'rose'
        },
        {
            title: 'Net Variance',
            value: `₦${(overallPerformance.totalActual - overallPerformance.totalBudget).toLocaleString()}`,
            icon: AlertCircle,
            colorScheme: 'violet'
        }
    ];

    // 2. Table Columns
    const columns: ColumnDef<typeof comparisonData[0]>[] = [
        {
            key: 'category',
            header: 'Category',
            cell: (item) => <span className="font-medium">{item.category}</span>
        },
        {
            key: 'budget',
            header: 'Budget (₦)',
            cell: (item) => `₦${item.budget.toLocaleString()}`
        },
        {
            key: 'actual',
            header: 'Actual (₦)',
            cell: (item) => `₦${item.actual.toLocaleString()}`
        },
        {
            key: 'variance',
            header: 'Variance',
            cell: (item) => (
                <div className={`flex flex-col`}>
                    <span className={item.variance > 0 ? 'text-rose-600' : 'text-green-600'}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                    </span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            cell: (item) => (
                <Badge variant={item.status === 'on-track' ? 'success' : 'destructive'}>
                    {item.status.replace('-', ' ').toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'progress',
            header: 'Progress',
            cell: (item) => (
                <Progress
                    value={Math.min((item.actual / (item.budget || 1)) * 100, 100)}
                    className={`h-2 w-24 ${item.status === 'on-track' ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                />
            )
        }
    ];

    // 3. Export Data
    const exportData = comparisonData.map(item => ({
        category: item.category,
        budget: item.budget,
        actual: item.actual,
        variance: item.variance,
        variancePercent: `${item.variancePercent.toFixed(1)}%`,
        status: item.status.toUpperCase()
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'category', header: 'Category' },
        { key: 'budget', header: 'Budget (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'actual', header: 'Actual (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'variance', header: 'Variance (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'variancePercent', header: 'Variance %' },
        { key: 'status', header: 'Status' }
    ];

    // Custom Month Picker
    const customFilter = (
        <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Budget Month:</Label>
            <Input
                type="month"
                value={format(date, 'yyyy-MM')}
                onChange={(e) => {
                    if (e.target.value) {
                        setFilters({ ...filters, startDate: new Date(e.target.value).toISOString() });
                    }
                }}
                className="w-[180px]"
            />
        </div>
    );

    return (
        <ReportLayout
            title="Budget vs Actual Analysis"
            description={`Monitoring financial discipline for ${format(date, 'MMMM yyyy')}`}
            icon={Target}
            isLoading={loading || budgetsLoading}
            emptyState={comparisonData.length === 0 ? (
                <div className="text-center py-10">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium">No budgets found</p>
                    <p className="text-sm text-muted-foreground">
                        No budget targets set for {format(date, 'MMMM yyyy')}
                    </p>
                </div>
            ) : undefined}
        >
            <ReportFiltersBar
                reportId="budget-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    branch: true,
                    custom: customFilter
                }}
                branches={branches}
            />

            <ReportSummaryCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <ReportChartPanel
                    title="Budget Alignment"
                    description="Visual comparison of targets vs. results"
                    chartType="bar"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="category" type="category" width={100} />
                            <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                                {comparisonData.slice(0, 10).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.status === 'on-track' ? '#10b981' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ReportChartPanel>
            </div>

            <ReportDataTable
                columns={columns}
                data={comparisonData}
                pageSize={50}
            />

            <ReportExportPanel
                reportName="Budget Vs Actual Report"
                data={exportData}
                columns={exportColumns}
                filters={{
                    month: format(date, 'MMMM yyyy'),
                    branch: filters.branchIds?.[0] === 'all' ? 'All Branches' : branches.find(b => b.id === filters.branchIds?.[0])?.name || 'Unknown'
                }}
                formats={['csv', 'print']}
            />

        </ReportLayout>
    );
};

export default BudgetVsActual;
