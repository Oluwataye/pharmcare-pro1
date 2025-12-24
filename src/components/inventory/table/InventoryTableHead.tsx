
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryTableHeadProps {
  showBatchActions: boolean;
  hasItems: boolean;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

export const InventoryTableHead = ({ 
  showBatchActions, 
  hasItems, 
  allSelected, 
  onSelectAll 
}: InventoryTableHeadProps) => {
  return (
    <TableHeader>
      <TableRow>
        {showBatchActions && (
          <TableHead className="w-[40px]">
            <Checkbox 
              checked={hasItems && allSelected} 
              onCheckedChange={onSelectAll}
              disabled={!hasItems}
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
  );
};
