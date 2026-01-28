
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { SelectItem } from "@/components/ui/select";
import { TextField, SelectField } from "@/components/inventory/form/FormField";
import { DatePickerField } from "@/components/inventory/form/DatePickerField";
import { UNIT_OPTIONS } from "@/components/inventory/form/formUtils";
import { Supplier } from "@/types/supplier";

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
    costPrice?: number;
    supplierId?: string;
    restockInvoiceNumber?: string;
    profitMargin?: number;
  };
  setFormData: (data: any) => void;
  expiryDate: Date | undefined;
  setExpiryDate: (date: Date | undefined) => void;
  customCategory?: string;
  setCustomCategory?: (value: string) => void;
  isAddingCategory?: boolean;
  setIsAddingCategory?: (value: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  categories?: string[];
  suppliers?: Supplier[];
  isBulkMode?: boolean;
}

export const AddInventoryForm = ({
  formData,
  setFormData,
  expiryDate,
  setExpiryDate,
  customCategory: propsCustomCategory,
  setCustomCategory: propsSetCustomCategory,
  isAddingCategory: propsIsAddingCategory,
  setIsAddingCategory: propsSetIsAddingCategory,
  handleSubmit,
  categories = [],
  suppliers = [],
  isBulkMode = false
}: AddInventoryFormProps) => {
  // Use internal state if props are not provided
  const [internalIsAddingCategory, setInternalIsAddingCategory] = useState(false);
  const [internalCustomCategory, setInternalCustomCategory] = useState("");

  const isAdding = propsIsAddingCategory !== undefined ? propsIsAddingCategory : internalIsAddingCategory;
  const setIsAdding = propsSetIsAddingCategory !== undefined ? propsSetIsAddingCategory : setInternalIsAddingCategory;
  const customCat = propsCustomCategory !== undefined ? propsCustomCategory : internalCustomCategory;
  const setCustomCat = propsSetCustomCategory !== undefined ? propsSetCustomCategory : setInternalCustomCategory;

  const handleCategoryChange = (value: string) => {
    if (value === "add-new") {
      setIsAdding(true);
    } else {
      setIsAdding(false);
      setFormData({ ...formData, category: value });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCustomCategorySubmit = () => {
    if (customCat.trim()) {
      setFormData({ ...formData, category: customCat });
      setIsAdding(false);
    }
  };

  const FormComponent = isBulkMode ? "div" : "form";
  const formProps = isBulkMode
    ? { className: "space-y-6" }
    : { onSubmit: handleSubmit, className: "space-y-6" };

  return (
    <FormComponent {...formProps}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-6">
          <div className="col-span-1 sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-2">Basic Information</h3>
          </div>

          <TextField
            id="name"
            label="Product Name"
            value={formData.name}
            onChange={(value) => handleInputChange("name", value)}
            required
            placeholder="Enter product name"
          />

          <TextField
            id="sku"
            label="SKU (Optional)"
            value={formData.sku}
            onChange={(value) => handleInputChange("sku", value)}
            placeholder="Leave blank to auto-generate"
          />

          {isAdding ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <TextField
                  id="custom-category"
                  label="New Category"
                  value={customCat}
                  onChange={setCustomCat}
                  required
                  placeholder="Type new category"
                />
                <div className="flex items-end gap-1 mb-0.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCustomCategorySubmit}
                    className="shrink-0"
                  >
                    Use
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(false)}
                    className="shrink-0 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
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
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-6">
          <div className="col-span-1 sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-2">Stock & Pricing</h3>
          </div>
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
            id="cost_price"
            label="Cost Price (₦)"
            type="number"
            value={formData.costPrice || 0}
            onChange={(value) => {
              const cost = parseFloat(value) || 0;
              const margin = formData.profitMargin || 0;
              const sellingPrice = cost + (cost * (margin / 100));
              setFormData({
                ...formData,
                costPrice: cost,
                price: parseFloat(sellingPrice.toFixed(2))
              });
            }}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />

          <TextField
            id="profit_margin"
            label="Profit Margin (%)"
            type="number"
            value={formData.profitMargin || 0}
            onChange={(value) => {
              const margin = parseFloat(value) || 0;
              const cost = formData.costPrice || 0;
              const sellingPrice = cost + (cost * (margin / 100));
              setFormData({
                ...formData,
                profitMargin: margin,
                price: parseFloat(sellingPrice.toFixed(2))
              });
            }}
            required
            min="10"
            max="50"
            placeholder="20"
          />

          <TextField
            id="price"
            label="Selling Price (₦)"
            type="number"
            value={formData.price}
            onChange={(value) => handleInputChange("price", parseFloat(value) || 0)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            description={`Profit: ₦${(formData.price - (formData.costPrice || 0)).toFixed(2)}`}
          />

          <TextField
            id="reorderLevel"
            label="Reorder Level"
            type="number"
            value={formData.reorderLevel}
            onChange={(value) => handleInputChange("reorderLevel", parseInt(value) || 0)}
            required
            min="0"
            placeholder="Low stock alert level"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
          <div className="col-span-1 sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-2">Supply Chain Information</h3>
          </div>
          {!isBulkMode && (
            <SelectField
              id="supplierId"
              label="Supplier"
              value={formData.supplierId || "none"}
              onValueChange={(value) => handleInputChange("supplierId", value)}
            >
              <SelectItem value="none">No Supplier</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectField>
          )}

          <TextField
            id="restockInvoiceNumber"
            label="Restock Invoice #"
            value={formData.restockInvoiceNumber || ""}
            onChange={(value) => handleInputChange("restockInvoiceNumber", value)}
            placeholder="Optional invoice reference"
          />

          <TextField
            id="manufacturer"
            label="Manufacturer"
            value={formData.manufacturer}
            onChange={(value) => handleInputChange("manufacturer", value)}
            placeholder="Company name"
          />

          <TextField
            id="batchNumber"
            label="Batch Number"
            value={formData.batchNumber}
            onChange={(value) => handleInputChange("batchNumber", value)}
            required
            placeholder="Manufacturing batch #"
          />
        </div>
      </div>

      {!isBulkMode && (
        <DialogFooter className="mt-6">
          <Button type="submit">Add Product</Button>
        </DialogFooter>
      )}
    </FormComponent>
  );
};
