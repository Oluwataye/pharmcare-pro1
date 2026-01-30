
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { SelectItem } from "@/components/ui/select";
import { TextField, SelectField } from "@/components/inventory/form/FormField";
import { DatePickerField } from "@/components/inventory/form/DatePickerField";
import { UNIT_OPTIONS } from "@/components/inventory/form/formUtils";
import { Supplier } from "@/types/supplier";
import { UnitConfig } from "@/types/inventory";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

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
    multi_unit_config?: UnitConfig[];
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
  const { settings: storeSettings } = useStoreSettings();

  // Use internal state if props are not provided
  const [internalIsAddingCategory, setInternalIsAddingCategory] = useState(false);
  const [internalCustomCategory, setInternalCustomCategory] = useState("");

  const isAdding = propsIsAddingCategory !== undefined ? propsIsAddingCategory : internalIsAddingCategory;
  const setIsAdding = propsSetIsAddingCategory !== undefined ? propsSetIsAddingCategory : setInternalIsAddingCategory;
  const customCat = propsCustomCategory !== undefined ? propsCustomCategory : internalCustomCategory;
  const setCustomCat = propsSetCustomCategory !== undefined ? propsSetCustomCategory : setInternalCustomCategory;

  // Apply default profit margin if not set
  useEffect(() => {
    if (storeSettings?.default_profit_margin && !formData.profitMargin) {
      setFormData({
        ...formData,
        profitMargin: storeSettings.default_profit_margin
      });
    }
  }, [storeSettings?.default_profit_margin]);

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

  const handleAddUnit = () => {
    const currentConfig = formData.multi_unit_config || [];
    setFormData({
      ...formData,
      multi_unit_config: [
        ...currentConfig,
        { unit: "", conversion: 1, price: 0, is_base: false }
      ]
    });
  };

  const handleRemoveUnit = (index: number) => {
    const currentConfig = [...(formData.multi_unit_config || [])];
    currentConfig.splice(index, 1);
    setFormData({ ...formData, multi_unit_config: currentConfig });
  };

  const handleUnitUpdate = (index: number, field: keyof UnitConfig, value: any) => {
    const currentConfig = [...(formData.multi_unit_config || [])];
    currentConfig[index] = { ...currentConfig[index], [field]: value };
    setFormData({ ...formData, multi_unit_config: currentConfig });
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
            min="0"
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

        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Multi-Unit Settings (Optional)</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUnit}
              className="gap-1 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Unit
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Define other units for this product (e.g., Card, Pack, Box) and how many base units they contain.</p>

          {(formData.multi_unit_config || []).length > 0 && (
            <div className="space-y-3">
              {(formData.multi_unit_config || []).map((unit, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-md border border-dashed items-end">
                  <div className="sm:col-span-1">
                    <Label className="text-xs mb-1 block">Unit Name</Label>
                    <SelectField
                      id={`unit-${idx}`}
                      label=""
                      value={unit.unit}
                      onValueChange={(val) => handleUnitUpdate(idx, 'unit', val)}
                    >
                      {UNIT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-xs mb-1 block">Conversion (Qty in 1)</Label>
                    <TextField
                      id={`conv-${idx}`}
                      label=""
                      type="number"
                      value={unit.conversion}
                      onChange={(val) => handleUnitUpdate(idx, 'conversion', parseInt(val) || 1)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label className="text-xs mb-1 block">Unit Price (₦)</Label>
                    <TextField
                      id={`uprice-${idx}`}
                      label=""
                      type="number"
                      value={unit.price}
                      onChange={(val) => handleUnitUpdate(idx, 'price', parseFloat(val) || 0)}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-10 w-10"
                      onClick={() => handleRemoveUnit(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
