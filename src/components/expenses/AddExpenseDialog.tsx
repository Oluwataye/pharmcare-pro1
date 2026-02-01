
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Wallet } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useExpenses, NewExpense } from "@/hooks/useExpenses";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
    "Staff Salaries",
    "Rent",
    "Logistics & Transportation",
    "Utility Bills",
    "Taxes & Levies",
    "Losses",
    "Damages",
    "Supplies",
    "Maintenance",
    "Other"
];

interface AddExpenseDialogProps {
    onExpenseAdded?: () => void;
}

export const AddExpenseDialog = ({ onExpenseAdded }: AddExpenseDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { addExpense } = useExpenses();
    const [formData, setFormData] = useState<NewExpense>({
        category: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: "",
        reference: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category || formData.amount <= 0) return;

        setIsLoading(true);
        const success = await addExpense(formData);
        setIsLoading(false);

        if (success) {
            setOpen(false);
            setFormData({
                category: "",
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                description: "",
                reference: ""
            });
            if (onExpenseAdded) onExpenseAdded();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Record Expense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Record New Expense
                        </DialogTitle>
                        <DialogDescription>
                            Enter the details of the operational expense below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (₦)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reference">Reference / Invoice # (Optional)</Label>
                            <Input
                                id="reference"
                                placeholder="e.g. INV-2024-001"
                                value={formData.reference || ''}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Additional details..."
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Expense"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
