import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRefund } from '@/hooks/sales/useRefund';
import { Refund } from '@/types/refund';
import { format } from 'date-fns';

interface RefundApprovalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refund: Refund | null;
}

export const RefundApprovalDialog = ({ open, onOpenChange, refund }: RefundApprovalDialogProps) => {
    const { processRefund, isLoading } = useRefund();
    const [rejectionReason, setRejectionReason] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = async () => {
        if (!refund) return;
        setAction('approve');
        const success = await processRefund({
            refund_id: refund.id,
            action: 'approve',
        });
        if (success) {
            onOpenChange(false);
            setAction(null);
        }
    };

    const handleReject = async () => {
        if (!refund || !rejectionReason.trim()) return;
        setAction('reject');
        const success = await processRefund({
            refund_id: refund.id,
            action: 'reject',
            rejection_reason: rejectionReason.trim(),
        });
        if (success) {
            onOpenChange(false);
            setAction(null);
            setRejectionReason('');
        }
    };

    if (!refund) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Review Refund Request</DialogTitle>
                    <DialogDescription>
                        Approve or reject this refund request from {refund.initiated_by_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Transaction ID</Label>
                            <p className="font-medium">{refund.transaction_id}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Sale ID</Label>
                            <p className="font-medium">{refund.sale_id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Customer</Label>
                            <p className="font-medium">{refund.customer_name || 'Walk-in'}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Requested By</Label>
                            <p className="font-medium">{refund.initiated_by_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Original Amount</Label>
                            <p className="font-medium">₦{refund.original_amount.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Refund Amount</Label>
                            <p className="font-medium text-destructive">₦{refund.refund_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Refund Type</Label>
                        <Badge variant={refund.refund_type === 'full' ? 'destructive' : 'secondary'}>
                            {refund.refund_type === 'full' ? 'Full Refund' : 'Partial Refund'}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Request Date</Label>
                        <p className="font-medium">{format(new Date(refund.initiated_at), 'PPpp')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Reason</Label>
                        <Alert>
                            <AlertDescription>{refund.refund_reason}</AlertDescription>
                        </Alert>
                    </div>

                    {refund.items && refund.items.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Items ({refund.items.length})</Label>
                            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                                {refund.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm py-1">
                                        <span>{item.name || item.product_name}</span>
                                        <span className="text-muted-foreground">
                                            {item.quantity} × ₦{item.price?.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {action === 'reject' && (
                        <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="Please provide a reason for rejecting this refund..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    {action !== 'reject' && (
                        <Button variant="destructive" onClick={() => setAction('reject')} disabled={isLoading}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                    )}
                    {action === 'reject' ? (
                        <Button variant="destructive" onClick={handleReject} disabled={isLoading || !rejectionReason.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    ) : (
                        <Button onClick={handleApprove} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Refund
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
