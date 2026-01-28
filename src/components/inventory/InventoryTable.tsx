
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EditInventoryDialog } from "./EditInventoryDialog";
import { InventoryItem } from "@/hooks/useInventory";
import { StockStatusCell } from "./table/StockStatusCell";
import { ExpiryDateCell } from "./table/ExpiryDateCell";
import { TableActions } from "./table/TableActions";
import { BatchDeleteBar } from "./table/BatchDeleteBar";
import { InventoryTableHead } from "./table/InventoryTableHead";
import { EmptyTableRow } from "./table/EmptyTableRow";
import { StockAdjustmentDialog } from "./dialog/StockAdjustmentDialog";

import { Supplier } from "@/types/supplier";

interface InventoryTableProps {
  inventory: InventoryItem[];
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, updatedItem: InventoryItem) => void;
  onAdjustStock?: (id: string, newQuantity: number, reason: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  suppliers?: Supplier[];
}

export const InventoryTable = ({
  inventory,
  onDeleteItem,
  onUpdateItem,
  onAdjustStock,
  onBatchDelete,
  suppliers
}: InventoryTableProps) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { color: "text-red-600" };
    if (item.quantity <= item.reorderLevel) return { color: "text-yellow-600" };
    return { color: "text-green-600" };
  };

  const handleEdit = (itemId: string) => {
    const item = inventory.find(item => item.id === itemId);
    if (item) setEditingItem(item);
  };

  const handleSave = (updatedItem: InventoryItem) => {
    onUpdateItem(updatedItem.id, updatedItem);
    setEditingItem(null);
  };

  const handleAdjust = (itemId: string) => {
    const item = inventory.find(item => item.id === itemId);
    if (item) setAdjustingItem(item);
  };

  const handleApplyAdjustment = (id: string, newQuantity: number, reason: string) => {
    if (onAdjustStock) {
      onAdjustStock(id, newQuantity, reason);
    } else {
      // Fallback if not provided (shouldn't happen with new hook)
      const item = inventory.find(i => i.id === id);
      if (item) onUpdateItem(id, { ...item, quantity: newQuantity });
    }
    setAdjustingItem(null);
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

  const colSpan = onBatchDelete ? 9 : 8;

  return (
    <>
      {selectedItems.length > 0 && (
        <BatchDeleteBar
          selectedCount={selectedItems.length}
          onBatchDelete={handleBatchDelete}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <InventoryTableHead
            showBatchActions={!!onBatchDelete}
            hasItems={inventory.length > 0}
            allSelected={inventory.length > 0 && selectedItems.length === inventory.length}
            onSelectAll={toggleSelectAll}
          />
          <TableBody>
            {inventory.length === 0 ? (
              <EmptyTableRow colSpan={colSpan} />
            ) : (
              inventory.map((item) => {
                const stockStatus = getStockStatus(item);
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
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      {item.supplierId && suppliers && suppliers.length > 0 && (
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary/20 flex items-center justify-center text-[8px]">S</span>
                          {suppliers.find(s => s.id === item.supplierId)?.name || 'Unknown Supplier'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <StockStatusCell item={item} />
                    </TableCell>
                    <TableCell>
                      <ExpiryDateCell item={item} />
                    </TableCell>
                    <TableCell className={`text-right ${stockStatus.color}`}>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      ₦{item.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <TableActions
                        itemId={item.id}
                        onEdit={() => handleEdit(item.id)}
                        onDelete={() => onDeleteItem(item.id)}
                        onAdjust={handleAdjust}
                      />
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

      {adjustingItem && (
        <StockAdjustmentDialog
          open={!!adjustingItem}
          onOpenChange={(open) => !open && setAdjustingItem(null)}
          item={adjustingItem}
          onSave={handleApplyAdjustment}
        />
      )}
    </>
  );
};
