
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/types/inventory";
import { TextField, SelectField } from "@/components/inventory/form/FormField";
import { DatePickerField } from "@/components/inventory/form/DatePickerField";
import { UNIT_OPTIONS } from "@/components/inventory/form/formUtils";
import { SelectItem } from "@/components/ui/select";

interface EditInventoryFormProps {
  formData: InventoryItem;
  setFormData: (data: InventoryItem) => void;
  expiryDate: Date | undefined;
  setExpiryDate: (date: Date | undefined) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditInventoryForm = ({
  formData,
  setFormData,
  expiryDate,
  setExpiryDate,
  onSubmit,
}: EditInventoryFormProps) => {
  
  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="edit-name"
          label="Product Name"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          required
        />
        
        <TextField
          id="edit-sku"
          label="SKU"
          value={formData.sku}
          onChange={(value) => handleInputChange("sku", value)}
          required
        />
        
        <TextField
          id="edit-category"
          label="Category"
          value={formData.category}
          onChange={(value) => handleInputChange("category", value)}
          required
        />
        
        <DatePickerField
          id="edit-expiryDate"
          label="Expiry Date"
          date={expiryDate}
          onDateChange={setExpiryDate}
        />
        
        <TextField
          id="edit-quantity"
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={(value) => handleInputChange("quantity", parseInt(value) || 0)}
          required
          min="0"
        />
        
        <SelectField
          id="edit-unit"
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
          id="edit-price"
          label="Price (₦)"
          type="number"
          value={formData.price}
          onChange={(value) => handleInputChange("price", parseFloat(value) || 0)}
          required
          min="0"
          step="0.01"
        />
        
        <TextField
          id="edit-reorderLevel"
          label="Reorder Level"
          type="number"
          value={formData.reorderLevel}
          onChange={(value) => handleInputChange("reorderLevel", parseInt(value) || 0)}
          required
          min="0"
        />
        
        <TextField
          id="edit-manufacturer"
          label="Manufacturer"
          value={formData.manufacturer || ""}
          onChange={(value) => handleInputChange("manufacturer", value)}
        />
        
        <TextField
          id="edit-batchNumber"
          label="Batch Number"
          value={formData.batchNumber || ""}
          onChange={(value) => handleInputChange("batchNumber", value)}
        />
      </div>
      
      <Button type="submit" className="mt-4">Save Changes</Button>
    </form>
  );
};
