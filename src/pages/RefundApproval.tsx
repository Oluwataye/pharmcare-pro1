import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRefund } from '@/hooks/sales/useRefund';
import { RefundApprovalDialog } from '@/components/refunds/RefundApprovalDialog';
import { Refund } from '@/types/refund';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { EnhancedStatCard } from '@/components/admin/EnhancedStatCard';

const RefundApproval = () => {
    const { refunds, isLoading, fetchRefunds } = useRefund();
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchRefunds();
    }, []);

    const handleReview = (refund: Refund) => {
        setSelectedRefund(refund);
        setShowApprovalDialog(true);
    };

    const handleDialogClose = (open: boolean) => {
        setShowApprovalDialog(open);
        if (!open) {
            setSelectedRefund(null);
            fetchRefunds(); // Refresh list after approval/rejection
        }
    };

    const pendingRefunds = refunds.filter(r => r.status === 'pending');
    const approvedRefunds = refunds.filter(r => r.status === 'approved');
    const rejectedRefunds = refunds.filter(r => r.status === 'rejected');

    const stats = {
        pending: pendingRefunds.length,
        approved: approvedRefunds.length,
        rejected: rejectedRefunds.length,
        totalAmount: approvedRefunds.reduce((sum, r) => sum + r.refund_amount, 0),
    };

    const renderRefundTable = (refundList: Refund[]) => {
        if (isLoading) {
            return (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            );
        }

        if (refundList.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    No refund requests found
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {refundList.map((refund) => (
                            <TableRow key={refund.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(refund.initiated_at), 'MMM dd, yyyy HH:mm')}
                                </TableCell>
                                <TableCell>{refund.transaction_id}</TableCell>
                                <TableCell>{refund.customer_name || 'Walk-in'}</TableCell>
                                <TableCell>{refund.initiated_by_name}</TableCell>
                                <TableCell>
                                    <Badge variant={refund.refund_type === 'full' ? 'destructive' : 'secondary'}>
                                        {refund.refund_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    ₦{refund.refund_amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="max-w-xs truncate" title={refund.refund_reason}>
                                    {refund.refund_reason}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            refund.status === 'approved'
                                                ? 'default'
                                                : refund.status === 'rejected'
                                                    ? 'destructive'
                                                    : 'secondary'
                                        }
                                    >
                                        {refund.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {refund.status === 'pending' ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReview(refund)}
                                        >
                                            Review
                                        </Button>
                                    ) : refund.status === 'approved' ? (
                                        <div className="text-xs text-muted-foreground">
                                            By {refund.approved_by_name}
                                            <br />
                                            {refund.approved_at && format(new Date(refund.approved_at), 'MMM dd, HH:mm')}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground">
                                            Rejected
                                            {refund.rejection_reason && (
                                                <p className="text-destructive" title={refund.rejection_reason}>
                                                    {refund.rejection_reason.substring(0, 30)}...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in px-2 md:px-0">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Refund Management</h1>
                <p className="text-muted-foreground">Review and approve refund requests from cashiers</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <EnhancedStatCard
                    title="Pending Requests"
                    value={stats.pending.toString()}
                    icon={Clock}
                    trend=""
                    trendUp={false}
                    onClick={() => setActiveTab('pending')}
                    route="/refunds"
                    colorScheme="warning"
                    comparisonLabel="Awaiting review"
                />
                <EnhancedStatCard
                    title="Approved"
                    value={stats.approved.toString()}
                    icon={CheckCircle}
                    trend=""
                    trendUp={true}
                    onClick={() => setActiveTab('approved')}
                    route="/refunds"
                    colorScheme="success"
                    comparisonLabel="Completed"
                />
                <EnhancedStatCard
                    title="Rejected"
                    value={stats.rejected.toString()}
                    icon={XCircle}
                    trend=""
                    trendUp={false}
                    onClick={() => setActiveTab('rejected')}
                    route="/refunds"
                    colorScheme="danger"
                    comparisonLabel="Declined"
                />
                <EnhancedStatCard
                    title="Total Refunded"
                    value={`₦${stats.totalAmount.toLocaleString()}`}
                    icon={DollarSign}
                    trend=""
                    trendUp={false}
                    onClick={() => { }}
                    route="/refunds"
                    colorScheme="primary"
                    comparisonLabel="Approved amount"
                />
            </div>

            {/* Refund Requests Table */}
            <EnhancedCard colorScheme="primary">
                <CardHeader>
                    <CardTitle>Refund Requests</CardTitle>
                    <CardDescription>Manage refund requests from cashiers</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">
                                Pending ({stats.pending})
                            </TabsTrigger>
                            <TabsTrigger value="approved">
                                Approved ({stats.approved})
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rejected ({stats.rejected})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-4">
                            {renderRefundTable(pendingRefunds)}
                        </TabsContent>
                        <TabsContent value="approved" className="mt-4">
                            {renderRefundTable(approvedRefunds)}
                        </TabsContent>
                        <TabsContent value="rejected" className="mt-4">
                            {renderRefundTable(rejectedRefunds)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </EnhancedCard>

            {/* Refund Approval Dialog */}
            <RefundApprovalDialog
                open={showApprovalDialog}
                onOpenChange={handleDialogClose}
                refund={selectedRefund}
            />
        </div>
    );
};

export default RefundApproval;
