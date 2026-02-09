import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import {
    ReportLayout,
    ReportFiltersBar,
    ReportSummaryCards,
    ReportDataTable,
    ReportExportPanel
} from '@/components/reports/shared';
import type { MetricCardData, ColumnDef, ExportColumn } from '@/components/reports/shared';
import { useReportFilters } from '@/hooks/reports/useReportFilters';

interface RefundReconciliationStats {
    refund_date: string;
    initiated_by: string;
    initiated_by_name: string;
    total_refunds: number;
    total_refund_amount: number;
    total_cash_returned: number;
    total_variance: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    flagged_count: number;
}

export const RefundReconciliationReport = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState<RefundReconciliationStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize filters
    const { filters, setFilters } = useReportFilters('refund-report', {
        startDate: subDays(new Date(), 30).toISOString(),
        endDate: new Date().toISOString()
    });

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('daily_refund_reconciliation')
                .select('*')
                .order('refund_date', { ascending: false });

            if (filters.startDate) {
                query = query.gte('refund_date', format(new Date(filters.startDate), 'yyyy-MM-dd'));
            }
            if (filters.endDate) {
                query = query.lte('refund_date', format(new Date(filters.endDate), 'yyyy-MM-dd'));
            }

            const { data, error } = await query;

            if (error) throw error;
            setStats(data || []);
        } catch (error) {
            console.error('Error fetching refund stats:', error);
            toast({
                title: 'Error',
                description: 'Failed to load refund reconciliation report',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [filters.startDate, filters.endDate]);

    // Calculate aggregates for Summary Cards
    const aggregates = useMemo(() => {
        return stats.reduce((acc, curr) => ({
            totalRefunds: acc.totalRefunds + curr.total_refunds,
            totalAmount: acc.totalAmount + curr.total_refund_amount,
            totalVariance: acc.totalVariance + curr.total_variance,
            totalFlagged: acc.totalFlagged + curr.flagged_count
        }), { totalRefunds: 0, totalAmount: 0, totalVariance: 0, totalFlagged: 0 });
    }, [stats]);

    // Metrics
    const metrics: MetricCardData[] = [
        {
            title: 'Total Refunds',
            value: aggregates.totalRefunds,
            icon: RefreshCw,
            description: 'Processed requests',
            colorScheme: 'blue'
        },
        {
            title: 'Refund Amount',
            value: `₦${aggregates.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: CheckCircle,
            colorScheme: 'primary'
        },
        {
            title: 'Total Variance',
            value: `₦${aggregates.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: AlertTriangle,
            description: 'Discrepancies found',
            colorScheme: aggregates.totalVariance !== 0 ? 'rose' : 'success'
        },
        {
            title: 'Flagged Transactions',
            value: aggregates.totalFlagged,
            icon: AlertCircle,
            description: 'Requires attention',
            colorScheme: aggregates.totalFlagged > 0 ? 'orange' : 'success'
        }
    ];

    // Table Columns
    const columns: ColumnDef<RefundReconciliationStats>[] = [
        {
            key: 'refund_date',
            header: 'Date',
            cell: (row) => format(new Date(row.refund_date), 'MMM dd, yyyy')
        },
        {
            key: 'initiated_by_name',
            header: 'Cashier',
            cell: (row) => <span className="font-medium">{row.initiated_by_name}</span>
        },
        {
            key: 'total_refunds',
            header: 'Count',
            cell: (row) => <div className="text-center">{row.total_refunds}</div>
        },
        {
            key: 'total_refund_amount',
            header: 'Refunded (₦)',
            cell: (row) => <div className="text-right font-medium">₦{row.total_refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        },
        {
            key: 'total_cash_returned',
            header: 'Returned (₦)',
            cell: (row) => <div className="text-right text-muted-foreground">₦{row.total_cash_returned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        },
        {
            key: 'total_variance',
            header: 'Variance',
            cell: (row) => (
                <div className={`flex items-center justify-end gap-1 ${Math.abs(row.total_variance) > 0.01 ? 'text-destructive font-bold' : 'text-green-600'}`}>
                    {Math.abs(row.total_variance) > 0.01 && <AlertTriangle className="h-3 w-3" />}
                    ₦{row.total_variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => (
                <div className="flex justify-center gap-1">
                    {row.flagged_count > 0 && (
                        <Badge variant="destructive" className="h-5 px-1" title={`${row.flagged_count} Flagged`}>
                            {row.flagged_count}F
                        </Badge>
                    )}
                    {row.pending_count > 0 && (
                        <Badge variant="secondary" className="h-5 px-1" title={`${row.pending_count} Pending`}>
                            {row.pending_count}P
                        </Badge>
                    )}
                    {row.rejected_count > 0 && (
                        <Badge variant="outline" className="h-5 px-1 border-destructive text-destructive" title={`${row.rejected_count} Rejected`}>
                            {row.rejected_count}R
                        </Badge>
                    )}
                    <Badge variant="outline" className="h-5 px-1 border-green-600 text-green-600" title={`${row.approved_count} Approved`}>
                        {row.approved_count}A
                    </Badge>
                </div>
            )
        }
    ];

    // Export Data
    const exportData = stats.map(row => ({
        date: row.refund_date,
        cashier: row.initiated_by_name,
        count: row.total_refunds,
        refunded: row.total_refund_amount,
        returned: row.total_cash_returned,
        variance: row.total_variance,
        approved: row.approved_count,
        rejected: row.rejected_count,
        pending: row.pending_count,
        flagged: row.flagged_count
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'date', header: 'Date' },
        { key: 'cashier', header: 'Cashier' },
        { key: 'count', header: 'Total Refunds' },
        { key: 'refunded', header: 'Refunded (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'returned', header: 'Returned (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'variance', header: 'Variance (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
        { key: 'approved', header: 'Approved' },
        { key: 'rejected', header: 'Rejected' },
        { key: 'pending', header: 'Pending' },
        { key: 'flagged', header: 'Flagged' }
    ];

    return (
        <ReportLayout
            title="Daily Refund Reconciliation"
            description="Audit daily refunds, cash returns, and identify variances"
            icon={CheckCircle}
            isLoading={isLoading}
            emptyState={stats.length === 0 ? undefined : undefined}
            onRefresh={fetchStats}
        >
            <ReportFiltersBar
                reportId="refund-report"
                filters={filters}
                onFiltersChange={setFilters}
                availableFilters={{
                    dateRange: true
                }}
            />

            <ReportSummaryCards metrics={metrics} />

            <ReportDataTable
                columns={columns}
                data={stats}
                pageSize={50}
            />

            <ReportExportPanel
                reportName="Refund Reconciliation Report"
                data={exportData}
                columns={exportColumns}
                filters={filters}
                formats={['csv', 'print']}
            />

        </ReportLayout>
    );
};
