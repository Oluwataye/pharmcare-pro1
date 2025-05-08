
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/inventory";
import { mockInventory } from "@/utils/mockInventoryData";
import { saveInventoryToLocalStorage, loadInventoryFromLocalStorage } from "@/utils/inventoryUtils";

export const useInventoryCore = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    // Try to get saved inventory from localStorage first
    return loadInventoryFromLocalStorage() || mockInventory;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    // In a real app, this would fetch fresh data from the API
    setTimeout(() => {
      const savedInventory = loadInventoryFromLocalStorage();
      if (savedInventory) {
        setInventory(savedInventory);
      }
      
      setIsLoading(false);
      toast({
        title: "Refreshing Inventory",
        description: "Inventory data has been refreshed.",
      });
    }, 800);
  };

  return {
    inventory,
    setInventory,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleRefresh
  };
};
