import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, AlertTriangle, Package, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditInventoryDialog } from "./EditInventoryDialog";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  reorderLevel: number;
}

interface InventoryTableProps {
  inventory: InventoryItem[];
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, updatedItem: InventoryItem) => void;
}

export const InventoryTable = ({ inventory, onDeleteItem, onUpdateItem }: InventoryTableProps) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { 
        color: "text-red-600", 
        message: "Out of stock",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }
    if (item.quantity <= item.reorderLevel) {
      return { 
        color: "text-yellow-600", 
        message: "Low stock",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }
    return { 
      color: "text-green-600", 
      message: "In stock",
      icon: <Package className="h-4 w-4" />
    };
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleSave = (updatedItem: InventoryItem) => {
    onUpdateItem(updatedItem.id, updatedItem);
    setEditingItem(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const stockStatus = getStockStatus(item);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`flex items-center gap-1 ${stockStatus.color}`}>
                              {stockStatus.icon}
                              <span>{stockStatus.message}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current Stock: {item.quantity} {item.unit}</p>
                            <p>Reorder Level: {item.reorderLevel} {item.unit}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${stockStatus.color}`}>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{item.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {editingItem && (
        <EditInventoryDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onSave={handleSave}
        />
      )}
    </>
  );
};
