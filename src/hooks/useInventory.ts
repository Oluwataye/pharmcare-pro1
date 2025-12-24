
import { useInventoryCore } from "@/hooks/inventory/useInventoryCore";
import { useInventoryCRUD } from "@/hooks/inventory/useInventoryCRUD";
import { useInventoryFilters } from "@/hooks/inventory/useInventoryFilters";
import { useInventoryPrint } from "@/hooks/useInventoryPrint";
import type { InventoryItem } from "@/types/inventory";

export type { InventoryItem };

export const useInventory = () => {
  const { inventory, isLoading, error, handleRefresh } = useInventoryCore();
  const { addItem, updateItem, deleteItem, batchDelete } = useInventoryCRUD();
  const { getCategories, getExpiringItems } = useInventoryFilters();
  const { handlePrint: printInventory } = useInventoryPrint();

  const handlePrint = async () => {
    await printInventory(inventory);
  };

  return {
    inventory,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    batchDelete,
    getCategories,
    getExpiringItems,
    handleRefresh,
    handlePrint,
  };
};
