
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddInventoryForm } from "./dialog/AddInventoryForm";
import { initialInventoryFormState } from "./form/formUtils";

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: string[];
  onAddItem: (item: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    reorderLevel: number;
    expiryDate?: string;
    manufacturer?: string;
    batchNumber?: string;
  }) => void;
}

export const AddInventoryDialog = ({
  open,
  onOpenChange,
  categories = [],
  onAddItem,
}: AddInventoryDialogProps) => {
  const [formData, setFormData] = useState(initialInventoryFormState);

  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the selected date if available
    const submitData = {
      ...formData,
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
      // If using custom category, use that instead of the selected one
      category: isAddingCategory ? customCategory : formData.category,
    };
    
    onAddItem(submitData);
    onOpenChange(false);
    
    // Reset form
    setFormData(initialInventoryFormState);
    setExpiryDate(undefined);
    setCustomCategory("");
    setIsAddingCategory(false);
    
    toast({
      title: "Success",
      description: "Product added successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>
        <AddInventoryForm
          formData={formData}
          setFormData={setFormData}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          customCategory={customCategory}
          setCustomCategory={setCustomCategory}
          isAddingCategory={isAddingCategory}
          setIsAddingCategory={setIsAddingCategory}
          handleSubmit={handleSubmit}
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
};
