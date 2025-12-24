
import React from "react";
import { AlertTriangle, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InventoryItem } from "@/hooks/useInventory";

interface StockStatusCellProps {
  item: InventoryItem;
}

export const StockStatusCell = ({ item }: StockStatusCellProps) => {
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

  const stockStatus = getStockStatus(item);

  return (
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
  );
};
