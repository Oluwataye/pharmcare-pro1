
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { SelectItem } from "@/components/ui/select";
import { TextField, SelectField } from "@/components/inventory/form/FormField";
import { DatePickerField } from "@/components/inventory/form/DatePickerField";
import { UNIT_OPTIONS } from "@/components/inventory/form/formUtils";

interface AddInventoryFormProps {
  formData: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    reorderLevel: number;
    expiryDate: string;
    manufacturer: string;
    batchNumber: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    reorderLevel: number;
    expiryDate: string;
    manufacturer: string;
    batchNumber: string;
  }>>;
  expiryDate: Date | undefined;
  setExpiryDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  customCategory: string;
  setCustomCategory: React.Dispatch<React.SetStateAction<string>>;
  isAddingCategory: boolean;
  setIsAddingCategory: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (e: React.FormEvent) => void;
  categories?: string[];
}

export const AddInventoryForm = ({
  formData,
  setFormData,
  expiryDate,
  setExpiryDate,
  customCategory,
  setCustomCategory,
  isAddingCategory,
  setIsAddingCategory,
  handleSubmit,
  categories = []
}: AddInventoryFormProps) => {

  const handleCategoryChange = (value: string) => {
    if (value === "add-new") {
      setIsAddingCategory(true);
    } else {
      setIsAddingCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="name"
          label="Product Name"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          required
        />
        
        <TextField
          id="sku"
          label="SKU"
          value={formData.sku}
          onChange={(value) => handleInputChange("sku", value)}
          required
        />
        
        {isAddingCategory ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <TextField
                id="custom-category"
                label="New Category"
                value={customCategory}
                onChange={setCustomCategory}
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddingCategory(false)}
                className="mt-8 shrink-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <SelectField
            id="category"
            label="Category"
            value={formData.category}
            onValueChange={handleCategoryChange}
            required
          >
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
            <SelectItem value="add-new">+ Add new category</SelectItem>
          </SelectField>
        )}
        
        <DatePickerField
          id="expiryDate"
          label="Expiry Date"
          date={expiryDate}
          onDateChange={setExpiryDate}
        />
        
        <TextField
          id="quantity"
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={(value) => handleInputChange("quantity", parseInt(value) || 0)}
          required
          min="0"
        />
        
        <SelectField
          id="unit"
          label="Unit"
          value={formData.unit}
          onValueChange={(value) => handleInputChange("unit", value)}
          required
        >
          {UNIT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectField>
        
        <TextField
          id="price"
          label="Price (₦)"
          type="number"
          value={formData.price}
          onChange={(value) => handleInputChange("price", parseFloat(value) || 0)}
          required
          min="0"
          step="0.01"
        />
        
        <TextField
          id="reorderLevel"
          label="Reorder Level"
          type="number"
          value={formData.reorderLevel}
          onChange={(value) => handleInputChange("reorderLevel", parseInt(value) || 0)}
          required
          min="0"
        />
        
        <TextField
          id="manufacturer"
          label="Manufacturer"
          value={formData.manufacturer}
          onChange={(value) => handleInputChange("manufacturer", value)}
        />
        
        <TextField
          id="batchNumber"
          label="Batch Number"
          value={formData.batchNumber}
          onChange={(value) => handleInputChange("batchNumber", value)}
        />
      </div>
      
      <DialogFooter className="mt-6">
        <Button type="submit">Add Product</Button>
      </DialogFooter>
    </form>
  );
};
