
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
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

interface AddInventoryFormProps {
  formData: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    reorderLevel: number;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">
            SKU *
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) =>
              setFormData({ ...formData, sku: e.target.value })
            }
            required
          />
        </div>
        
        {isAddingCategory ? (
          <div className="space-y-2">
            <Label htmlFor="custom-category">
              New Category *
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddingCategory(false)}
                className="shrink-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="category">
              Category *
            </Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="add-new">+ Add new category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="expiryDate">
            Expiry Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
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
          <Label htmlFor="quantity">
            Quantity *
          </Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: parseInt(e.target.value) || 0,
              })
            }
            required
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">
            Unit *
          </Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger id="unit">
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
          <Label htmlFor="price">
            Price (₦) *
          </Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">
            Reorder Level *
          </Label>
          <Input
            id="reorderLevel"
            type="number"
            value={formData.reorderLevel}
            onChange={(e) =>
              setFormData({
                ...formData,
                reorderLevel: parseInt(e.target.value) || 0,
              })
            }
            required
            min="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="manufacturer">
            Manufacturer
          </Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) =>
              setFormData({ ...formData, manufacturer: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchNumber">
            Batch Number
          </Label>
          <Input
            id="batchNumber"
            value={formData.batchNumber}
            onChange={(e) =>
              setFormData({ ...formData, batchNumber: e.target.value })
            }
          />
        </div>
      </div>
      
      <DialogFooter className="mt-6">
        <Button type="submit">Add Product</Button>
      </DialogFooter>
    </form>
  );
};
