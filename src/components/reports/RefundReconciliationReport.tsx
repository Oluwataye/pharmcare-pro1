import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
    const [stats, setStats] = useState<RefundReconciliationStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_refund_reconciliation')
                .select('*')
                .order('refund_date', { ascending: false });

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
    }, []);

    const exportToCSV = () => {
        const headers = ['Date', 'Cashier', 'Total Refunds', 'Refund Amount', 'Cash Returned', 'Variance', 'Approved', 'Rejected', 'Pending', 'Flagged'];
        const csvContent = [
            headers.join(','),
            ...stats.map(row => [
                row.refund_date,
                `"${row.initiated_by_name}"`,
                row.total_refunds,
                row.total_refund_amount,
                row.total_cash_returned,
                row.total_variance,
                row.approved_count,
                row.rejected_count,
                row.pending_count,
                row.flagged_count
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `refund_reconciliation_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Daily Refund Reconciliation
                        </CardTitle>
                        <CardDescription>
                            Audit daily refunds, cash returns, and identify variances
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={stats.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Cashier</TableHead>
                                <TableHead className="text-center">Count</TableHead>
                                <TableHead className="text-right">Total Refunded</TableHead>
                                <TableHead className="text-right">Cash Returned</TableHead>
                                <TableHead className="text-right">Variance</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No data available
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stats.map((row, index) => (
                                    <TableRow key={`${row.refund_date}-${row.initiated_by}-${index}`}>
                                        <TableCell>{format(new Date(row.refund_date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="font-medium">{row.initiated_by_name}</TableCell>
                                        <TableCell className="text-center">{row.total_refunds}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₦{row.total_refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            ₦{row.total_cash_returned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`flex items-center justify-end gap-1 ${Math.abs(row.total_variance) > 0.01 ? 'text-destructive font-bold' : 'text-green-600'
                                                }`}>
                                                {Math.abs(row.total_variance) > 0.01 && <AlertTriangle className="h-3 w-3" />}
                                                ₦{row.total_variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
