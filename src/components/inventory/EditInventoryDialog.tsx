
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryItem } from "@/types/inventory";
import { EditInventoryForm } from "./dialog/EditInventoryForm";

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  onSave: (updatedItem: InventoryItem) => void;
}

export const EditInventoryDialog = ({
  open,
  onOpenChange,
  item,
  onSave,
}: EditInventoryDialogProps) => {
  const [formData, setFormData] = useState<InventoryItem>(item);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    item.expiryDate ? new Date(item.expiryDate) : undefined
  );
  const { toast } = useToast();

  // Update form data when item changes
  useEffect(() => {
    setFormData(item);
    setExpiryDate(item.expiryDate ? new Date(item.expiryDate) : undefined);
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedItem = {
      ...formData,
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
    };
    
    onSave(updatedItem);
    onOpenChange(false);
    toast({
      title: "Success",
      description: "Item updated successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>
        <EditInventoryForm
          formData={formData}
          setFormData={setFormData}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
