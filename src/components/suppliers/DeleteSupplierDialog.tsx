
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
import { useSuppliers } from "@/hooks/useSuppliers";
import { Supplier } from "@/types/supplier";

interface DeleteSupplierDialogProps {
    supplier: Supplier;
    onSupplierDeleted?: () => void;
}

export const DeleteSupplierDialog = ({ supplier, onSupplierDeleted }: DeleteSupplierDialogProps) => {
    const { deleteSupplier, isLoading } = useSuppliers();

    const handleDelete = async () => {
        const success = await deleteSupplier(supplier.id);
        if (success && onSupplierDeleted) {
            onSupplierDeleted();
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-destructive/10 group" title="Delete Supplier">
                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <strong>{supplier.name}</strong>.
                        This action cannot be undone and may fail if the supplier is linked to inventory items.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete Supplier"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
