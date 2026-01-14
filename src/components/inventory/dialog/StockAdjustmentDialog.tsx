
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/inventory/form/FormField";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem;
    onSave: (id: string, newQuantity: number, reason: string) => void;
}

export const StockAdjustmentDialog = ({
    open,
    onOpenChange,
    item,
    onSave,
}: StockAdjustmentDialogProps) => {
    const [physicalStock, setPhysicalStock] = useState<number>(item.quantity);
    const [difference, setDifference] = useState<number>(0);
    const [reason, setReason] = useState<string>("");
    const { toast } = useToast();

    useEffect(() => {
        setPhysicalStock(item.quantity);
        setDifference(0);
        setReason("");
    }, [item]);

    useEffect(() => {
        setDifference(physicalStock - item.quantity);
    }, [physicalStock, item.quantity]);

    const handleSave = () => {
        if (difference !== 0 && !reason.trim()) {
            toast({
                title: "Reason Required",
                description: "Please provide a reason for the stock adjustment.",
                variant: "destructive"
            });
            return;
        }

        onSave(item.id, physicalStock, reason || "Manual adjustment");
        onOpenChange(false);
    };

    const getDiffColor = () => {
        if (difference > 0) return "text-green-600";
        if (difference < 0) return "text-red-600";
        return "text-blue-600";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock: {item.name}</DialogTitle>
                    <DialogDescription>
                        Compare physical stock count with system stock level.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Stock</div>
                        <div className="text-2xl font-bold">{item.quantity} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></div>
                    </div>

                    <TextField
                        id="physical-stock"
                        label="Physical Stock (Manual Count)"
                        type="number"
                        value={physicalStock}
                        onChange={(val) => setPhysicalStock(parseInt(val) || 0)}
                        min="0"
                    />

                    <TextField
                        id="adjustment-reason"
                        label="Reason for Adjustment"
                        placeholder="e.g., Damaged, Found in warehouse, Reconciliation"
                        value={reason}
                        onChange={setReason}
                        required={difference !== 0}
                    />

                    <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="text-sm font-medium">Difference</div>
                        <div className={`text-2xl font-bold ${getDiffColor()}`}>
                            {difference > 0 ? '+' : ''}{difference}
                        </div>
                    </div>

                    {difference !== 0 && (
                        <div className={`text-xs p-2 rounded ${difference < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            Note: This will record a {difference < 0 ? 'Negative' : 'Positive'} adjustment of {Math.abs(difference)} {item.unit} in the system.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Apply Adjustment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
