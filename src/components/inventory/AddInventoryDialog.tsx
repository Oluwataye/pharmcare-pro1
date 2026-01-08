import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddInventoryForm } from "./dialog/AddInventoryForm";
import { BulkProductForm } from "./dialog/BulkProductForm";
import { initialInventoryFormState } from "./form/formUtils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  }) => Promise<void> | void; // Allow promise for bulk handling
}

export const AddInventoryDialog = ({
  open,
  onOpenChange,
  categories = [],
  onAddItem,
}: AddInventoryDialogProps) => {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  // Single Item State
  const [formData, setFormData] = useState(initialInventoryFormState);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);

  // Bulk Items State
  const [bulkItems, setBulkItems] = useState([
    { ...initialInventoryFormState, id: 0, expiryDateObj: undefined as Date | undefined }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
        category: isAddingCategory ? customCategory : formData.category,
      };

      await onAddItem(submitData);

      // Reset and close
      onOpenChange(false);
      setFormData(initialInventoryFormState);
      setExpiryDate(undefined);
      setCustomCategory("");
      setIsAddingCategory(false);

      toast({ title: "Success", description: "Product added successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate at least one item
      if (bulkItems.length === 0) return;

      let successCount = 0;

      // Process sequentially to avoid race conditions or use Promise.all if supported
      for (const item of bulkItems) {
        if (!item.name || !item.sku) continue; // Skip empty rows

        const submitData = {
          name: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          reorderLevel: item.reorderLevel,
          expiryDate: item.expiryDateObj ? item.expiryDateObj.toISOString().split('T')[0] : undefined,
          manufacturer: item.manufacturer,
          batchNumber: item.batchNumber
        };
        await onAddItem(submitData);
        successCount++;
      }

      toast({
        title: "Bulk Add Complete",
        description: `Successfully added ${successCount} products.`,
      });

      onOpenChange(false);
      setBulkItems([{ ...initialInventoryFormState, id: 0, expiryDateObj: undefined }]);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to process bulk items", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Manipulations
  const updateBulkItem = (index: number, data: any) => {
    const newItems = [...bulkItems];
    newItems[index] = data;
    setBulkItems(newItems);
  };

  const removeBulkItem = (index: number) => {
    setBulkItems(bulkItems.filter((_, i) => i !== index));
  };

  const addBulkRow = () => {
    setBulkItems([...bulkItems, { ...initialInventoryFormState, id: Date.now(), expiryDateObj: undefined }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={mode === 'bulk' ? "sm:max-w-[700px] max-h-[85vh] overflow-y-auto" : "sm:max-w-[550px]"}>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add inventory items to your stock.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v: string) => setMode(v as "single" | "bulk")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="single">Single Item</TabsTrigger>
            <TabsTrigger value="bulk">Receive Stock (Bulk)</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <AddInventoryForm
              formData={formData}
              setFormData={setFormData}
              expiryDate={expiryDate}
              setExpiryDate={setExpiryDate}
              customCategory={customCategory}
              setCustomCategory={setCustomCategory}
              isAddingCategory={isAddingCategory}
              setIsAddingCategory={setIsAddingCategory}
              handleSubmit={handleSingleSubmit}
              categories={categories}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkProductForm
              items={bulkItems}
              onUpdateItem={updateBulkItem}
              onRemoveItem={removeBulkItem}
              onAddItem={addBulkRow}
              categories={categories}
            />
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleBulkSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : `Save ${bulkItems.length} Products`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
