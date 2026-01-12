
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
    onSave: (updatedItem: InventoryItem) => void;
}

export const StockAdjustmentDialog = ({
    open,
    onOpenChange,
    item,
    onSave,
}: StockAdjustmentDialogProps) => {
    const [physicalStock, setPhysicalStock] = useState<number>(item.quantity);
    const [difference, setDifference] = useState<number>(0);
    const { toast } = useToast();

    useEffect(() => {
        setPhysicalStock(item.quantity);
        setDifference(0);
    }, [item]);

    useEffect(() => {
        setDifference(physicalStock - item.quantity);
    }, [physicalStock, item.quantity]);

    const handleSave = () => {
        onSave({
            ...item,
            quantity: physicalStock,
        });
        onOpenChange(false);

        const status = difference > 0 ? "gain" : difference < 0 ? "loss" : "no change";
        toast({
            title: "Stock Adjusted",
            description: `Stock for ${item.name} updated. Difference: ${difference > 0 ? '+' : ''}${difference} (${status}).`,
        });
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
