import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRefund } from '@/hooks/sales/useRefund';
import { RefundRequest } from '@/types/refund';

interface RefundDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleId: string;
    transactionId: string;
    originalAmount: number;
    customerName?: string;
    items?: any[];
}

export const RefundDialog = ({
    open,
    onOpenChange,
    saleId,
    transactionId,
    originalAmount,
    customerName,
    items,
}: RefundDialogProps) => {
    const { initiateRefund, isLoading, checkRefundExists } = useRefund();
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [partialAmount, setPartialAmount] = useState('');
    const [reason, setReason] = useState('');
    const [hasExistingRefund, setHasExistingRefund] = useState(false);
    const [isCheckingRefund, setIsCheckingRefund] = useState(true);

    useEffect(() => {
        if (open) {
            // Check if refund already exists
            checkRefundExists(saleId).then((exists) => {
                setHasExistingRefund(exists);
                setIsCheckingRefund(false);
            });
        } else {
            // Reset form when dialog closes
            setRefundType('full');
            setPartialAmount('');
            setReason('');
            setHasExistingRefund(false);
            setIsCheckingRefund(true);
        }
    }, [open, saleId]);

    const handleSubmit = async () => {
        const refundAmount = refundType === 'full' ? originalAmount : parseFloat(partialAmount);

        if (!refundAmount || refundAmount <= 0) {
            return;
        }

        if (refundAmount > originalAmount) {
            return;
        }

        if (!reason.trim()) {
            return;
        }

        const request: RefundRequest = {
            sale_id: saleId,
            transaction_id: transactionId,
            refund_amount: refundAmount,
            refund_reason: reason.trim(),
            refund_type: refundType,
            original_amount: originalAmount,
            customer_name: customerName,
            items,
        };

        const success = await initiateRefund(request);
        if (success) {
            onOpenChange(false);
        }
    };

    const isValid = () => {
        if (!reason.trim()) return false;
        if (refundType === 'partial') {
            const amount = parseFloat(partialAmount);
            return amount > 0 && amount <= originalAmount;
        }
        return true;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Refund</DialogTitle>
                    <DialogDescription>
                        Submit a refund request for admin approval. Transaction: {transactionId}
                    </DialogDescription>
                </DialogHeader>

                {isCheckingRefund ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : hasExistingRefund ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            A refund request already exists for this sale. Please check the refund status or contact an admin.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Original Amount</Label>
                            <Input value={`₦${originalAmount.toLocaleString()}`} disabled />
                        </div>

                        {customerName && (
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Input value={customerName} disabled />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Refund Type</Label>
                            <RadioGroup value={refundType} onValueChange={(value) => setRefundType(value as 'full' | 'partial')}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="full" id="full" />
                                    <Label htmlFor="full" className="font-normal cursor-pointer">
                                        Full Refund (₦{originalAmount.toLocaleString()})
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="partial" id="partial" />
                                    <Label htmlFor="partial" className="font-normal cursor-pointer">
                                        Partial Refund
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {refundType === 'partial' && (
                            <div className="space-y-2">
                                <Label htmlFor="amount">Refund Amount (₦)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    max={originalAmount}
                                    min={0}
                                    step="0.01"
                                />
                                {parseFloat(partialAmount) > originalAmount && (
                                    <p className="text-sm text-destructive">Amount cannot exceed original amount</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Refund *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please provide a detailed reason for the refund..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        <Alert>
                            <AlertDescription>
                                This refund request will be sent to an admin for approval. You will be notified once it's processed.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    {!hasExistingRefund && !isCheckingRefund && (
                        <Button onClick={handleSubmit} disabled={isLoading || !isValid()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
