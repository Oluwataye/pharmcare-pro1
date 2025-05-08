
import { InventoryItem } from "@/types/inventory";
import { useInventoryCore } from "@/hooks/inventory/useInventoryCore";
import { getCategories as getCategoriesUtil, getExpiringItems as getExpiringItemsUtil } from "@/utils/inventoryUtils";

export const useInventoryFilters = () => {
  const { inventory } = useInventoryCore();

  // Get all categories for filtering
  const getCategories = (): string[] => {
    return getCategoriesUtil(inventory);
  };

  // Get expiring items
  const getExpiringItems = (daysThreshold: number = 90): InventoryItem[] => {
    return getExpiringItemsUtil(inventory, daysThreshold);
  };

  return {
    getCategories,
    getExpiringItems,
  };
};
