import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

    // Cash reconciliation state
    const [cashReturnedAmount, setCashReturnedAmount] = useState('');
    const [registerBalanceBefore, setRegisterBalanceBefore] = useState('');
    const [registerBalanceAfter, setRegisterBalanceAfter] = useState('');

    // Calculate variance
    const calculateVariance = () => {
        const returned = parseFloat(cashReturnedAmount) || 0;
        const before = parseFloat(registerBalanceBefore) || 0;
        const after = parseFloat(registerBalanceAfter) || 0;
        return before - returned - after;
    };

    const variance = calculateVariance();

    const handleApprove = async () => {
        if (!refund) return;

        // Validate cash reconciliation fields
        if (!cashReturnedAmount || !registerBalanceBefore || !registerBalanceAfter) {
            return; // Fields are required
        }

        setAction('approve');
        const success = await processRefund({
            refund_id: refund.id,
            action: 'approve',
            cash_returned_amount: parseFloat(cashReturnedAmount),
            register_balance_before: parseFloat(registerBalanceBefore),
            register_balance_after: parseFloat(registerBalanceAfter),
        });
        if (success) {
            onOpenChange(false);
            setAction(null);
            // Reset cash fields
            setCashReturnedAmount('');
            setRegisterBalanceBefore('');
            setRegisterBalanceAfter('');
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

                    {/* Cash Reconciliation Section - Required for Approval */}
                    {action === 'approve' && (
                        <div className="space-y-4 border-t pt-4 mt-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <Label className="text-base font-semibold">Cash Reconciliation Required</Label>
                            </div>

                            <Alert>
                                <AlertDescription className="text-sm">
                                    Please count the cash and verify register balance before approving this refund.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cash-returned">Cash Returned to Customer (₦) *</Label>
                                    <Input
                                        id="cash-returned"
                                        type="number"
                                        placeholder="0.00"
                                        value={cashReturnedAmount}
                                        onChange={(e) => setCashReturnedAmount(e.target.value)}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="balance-before">Register Balance Before (₦) *</Label>
                                    <Input
                                        id="balance-before"
                                        type="number"
                                        placeholder="0.00"
                                        value={registerBalanceBefore}
                                        onChange={(e) => setRegisterBalanceBefore(e.target.value)}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="balance-after">Register Balance After (₦) *</Label>
                                <Input
                                    id="balance-after"
                                    type="number"
                                    placeholder="0.00"
                                    value={registerBalanceAfter}
                                    onChange={(e) => setRegisterBalanceAfter(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            {/* Variance Indicator */}
                            {cashReturnedAmount && registerBalanceBefore && registerBalanceAfter && (
                                <Alert variant={Math.abs(variance) > 0.01 ? "destructive" : "default"}>
                                    <AlertDescription className="flex justify-between items-center">
                                        <span className="font-medium">Calculated Variance:</span>
                                        <span className={`text-lg font-bold ${Math.abs(variance) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
                                            ₦{variance.toFixed(2)}
                                        </span>
                                    </AlertDescription>
                                    {Math.abs(variance) > 0.01 && (
                                        <AlertDescription className="text-xs mt-2">
                                            ⚠️ Warning: Variance detected! Expected: ₦0.00. Please verify amounts before approving.
                                        </AlertDescription>
                                    )}
                                </Alert>
                            )}
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
                    ) : action === 'approve' ? (
                        <Button onClick={handleApprove} disabled={isLoading || !cashReturnedAmount || !registerBalanceBefore || !registerBalanceAfter}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Approval
                        </Button>
                    ) : (
                        <Button onClick={() => setAction('approve')} disabled={isLoading}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Refund
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
