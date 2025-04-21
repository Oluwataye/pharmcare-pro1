
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, AlertTriangle, ShoppingCart, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

export const InventoryTable = ({ inventory, onDeleteItem }: InventoryTableProps) => {
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { color: "text-red-600", message: "Out of stock" };
    if (item.quantity <= item.reorderLevel) return { color: "text-yellow-600", message: "Low stock" };
    return { color: "text-green-600", message: "In stock" };
  };

  return (
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
                    {item.quantity <= item.reorderLevel ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className={`h-4 w-4 ${stockStatus.color}`} />
                              <span className={stockStatus.color}>{stockStatus.message}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reorder level: {item.reorderLevel} {item.unit}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className={`flex items-center gap-1 ${stockStatus.color}`}>
                        <Package className="h-4 w-4" />
                        {stockStatus.message}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={item.quantity <= item.reorderLevel ? stockStatus.color : ""}>
                    {item.quantity} {item.unit}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ₦{item.price.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
  );
};
