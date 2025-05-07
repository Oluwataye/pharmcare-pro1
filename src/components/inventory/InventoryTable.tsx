
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
import { Trash, AlertTriangle, Package, Pencil, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditInventoryDialog } from "./EditInventoryDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItem } from "@/hooks/useInventory";

interface InventoryTableProps {
  inventory: InventoryItem[];
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, updatedItem: InventoryItem) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const InventoryTable = ({ 
  inventory, 
  onDeleteItem, 
  onUpdateItem,
  onBatchDelete 
}: InventoryTableProps) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
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

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { color: "", message: "No expiry date" };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { color: "text-red-600", message: "Expired" };
    }
    if (daysUntilExpiry <= 30) {
      return { color: "text-red-600", message: "Expires soon" };
    }
    if (daysUntilExpiry <= 90) {
      return { color: "text-yellow-600", message: "Expiry approaching" };
    }
    return { color: "", message: "Valid" };
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleSave = (updatedItem: InventoryItem) => {
    onUpdateItem(updatedItem.id, updatedItem);
    setEditingItem(null);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(inventory.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.length > 0 && onBatchDelete) {
      onBatchDelete(selectedItems);
      setSelectedItems([]);
    }
  };

  return (
    <>
      {selectedItems.length > 0 && (
        <div className="flex justify-between items-center py-2 mb-2 bg-muted/30 px-3 rounded-md">
          <div className="text-sm">
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBatchDelete}
          >
            <Trash className="h-4 w-4 mr-1" /> Delete Selected
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onBatchDelete && (
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={inventory.length > 0 && selectedItems.length === inventory.length} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onBatchDelete ? 9 : 8} className="h-24 text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <TableRow key={item.id}>
                    {onBatchDelete && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(item.id)} 
                          onCheckedChange={(checked) => toggleSelectItem(item.id, !!checked)}
                        />
                      </TableCell>
                    )}
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
                    <TableCell className={expiryStatus.color}>
                      {item.expiryDate ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{expiryStatus.message}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        "N/A"
                      )}
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
              })
            )}
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
