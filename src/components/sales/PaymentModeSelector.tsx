import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Wallet, CreditCard, Banknote } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PaymentMode {
    mode: 'cash' | 'pos' | 'transfer';
    amount: number;
}

interface PaymentModeSelectorProps {
    total: number;
    payments: PaymentMode[];
    onPaymentsChange: (payments: PaymentMode[]) => void;
}

export const PAYMENT_MODES: { value: PaymentMode['mode']; label: string; icon: any }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'pos', label: 'POS (Card)', icon: CreditCard },
    { value: 'transfer', label: 'Bank Transfer', icon: Wallet },
];

const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({
    total,
    payments,
    onPaymentsChange
}) => {
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - currentTotal;
    const isMatched = Math.abs(remaining) < 0.01;

    const addPaymentMode = () => {
        if (remaining <= 0) return;

        // Find a mode not yet fully used, default to the first available or cash
        const usedModes = payments.map(p => p.mode);
        const nextMode = PAYMENT_MODES.find(m => !usedModes.includes(m.value))?.value || 'cash';

        onPaymentsChange([...payments, { mode: nextMode, amount: remaining }]);
    };

    const removePayment = (index: number) => {
        const newPayments = payments.filter((_, i) => i !== index);
        onPaymentsChange(newPayments);
    };

    const updatePayment = (index: number, updates: Partial<PaymentMode>) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], ...updates };
        onPaymentsChange(newPayments);
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment Method
                </h3>
                <Badge variant={isMatched ? "default" : "destructive"}>
                    {isMatched
                        ? "Amount Matched"
                        : remaining > 0
                            ? `Remaining: ₦${remaining.toLocaleString()}`
                            : `Overpaid: ₦${Math.abs(remaining).toLocaleString()}`
                    }
                </Badge>
            </div>

            <div className="space-y-3">
                {payments.map((payment, index) => (
                    <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Mode</Label>
                            <Select
                                value={payment.mode}
                                onValueChange={(val: any) => updatePayment(index, { mode: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_MODES.map(mode => (
                                        <SelectItem key={mode.value} value={mode.value}>
                                            <div className="flex items-center gap-2">
                                                <mode.icon className="h-4 w-4 text-muted-foreground" />
                                                {mode.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Amount (₦)</Label>
                            <Input
                                type="number"
                                value={payment.amount || ""}
                                onChange={(e) => updatePayment(index, { amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>
                        {payments.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => removePayment(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={addPaymentMode}
                disabled={remaining <= 0}
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Method
            </Button>

            {remaining < 0 && (
                <p className="text-[10px] text-destructive font-medium text-center">
                    Warning: Total payment exceeds transaction amount.
                </p>
            )}
        </div>
    );
};

export default PaymentModeSelector;
