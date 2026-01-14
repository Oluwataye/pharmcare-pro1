import { useInventoryContext } from "@/contexts/InventoryContext";

export const useInventoryCore = () => {
  const context = useInventoryContext();

  return {
    inventory: context.inventory,
    setInventory: context.setInventory,
    isLoading: context.isLoading,
    setIsLoading: context.setIsLoading,
    error: context.error,
    setError: context.setError,
    handleRefresh: context.handleRefresh
  };
};
