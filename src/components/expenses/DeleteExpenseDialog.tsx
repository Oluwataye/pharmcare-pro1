
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useState } from "react";

interface DeleteExpenseDialogProps {
    expense: Expense;
    onExpenseDeleted?: () => void;
}

export const DeleteExpenseDialog = ({ expense, onExpenseDeleted }: DeleteExpenseDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const { deleteExpense } = useExpenses();

    const handleDelete = async () => {
        setIsLoading(true);
        const success = await deleteExpense(expense.id);
        setIsLoading(false);
        if (success && onExpenseDeleted) {
            onExpenseDeleted();
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete the expense record for
                        <span className="font-semibold text-foreground mx-1">
                            {expense.category} (₦{expense.amount.toLocaleString()})
                        </span>
                        from {new Date(expense.date).toLocaleDateString()}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? "Deleting..." : "Delete Expense"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
