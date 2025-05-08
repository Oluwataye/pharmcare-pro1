
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/types/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Product Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-sku">SKU *</Label>
          <Input
            id="edit-sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-category">Category *</Label>
          <Input
            id="edit-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-expiryDate">Expiry Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="edit-expiryDate"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expiryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiryDate ? format(expiryDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={expiryDate}
                onSelect={setExpiryDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-quantity">Quantity *</Label>
          <Input
            id="edit-quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            required
            min="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-unit">Unit *</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger id="edit-unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tablets">Tablets</SelectItem>
              <SelectItem value="capsules">Capsules</SelectItem>
              <SelectItem value="bottles">Bottles</SelectItem>
              <SelectItem value="vials">Vials</SelectItem>
              <SelectItem value="boxes">Boxes</SelectItem>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="l">l</SelectItem>
              <SelectItem value="mg">mg</SelectItem>
              <SelectItem value="g">g</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-price">Price (₦) *</Label>
          <Input
            id="edit-price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-reorderLevel">Reorder Level *</Label>
          <Input
            id="edit-reorderLevel"
            type="number"
            value={formData.reorderLevel}
            onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
            required
            min="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-manufacturer">Manufacturer</Label>
          <Input
            id="edit-manufacturer"
            value={formData.manufacturer || ""}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-batchNumber">Batch Number</Label>
          <Input
            id="edit-batchNumber"
            value={formData.batchNumber || ""}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
          />
        </div>
      </div>
      
      <Button type="submit" className="mt-4">Save Changes</Button>
    </form>
  );
};
