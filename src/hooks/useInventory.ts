
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useOffline } from "@/contexts/OfflineContext";
import { InventoryItem } from "@/types/inventory";
import { mockInventory } from "@/utils/mockInventoryData";
import { 
  saveInventoryToLocalStorage, 
  loadInventoryFromLocalStorage,
  validateInventoryItem,
  getCategories as getCategoriesUtil,
  getExpiringItems as getExpiringItemsUtil
} from "@/utils/inventoryUtils";
import { useInventoryPrint } from "@/hooks/useInventoryPrint";

export { InventoryItem };

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    // Try to get saved inventory from localStorage first
    return loadInventoryFromLocalStorage() || mockInventory;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { 
    createOfflineItem, 
    updateOfflineItem, 
    deleteOfflineItem 
  } = useOfflineData();
  const { handlePrint: printInventory } = useInventoryPrint();

  const addItem = (newItem: Omit<InventoryItem, "id" | "lastUpdatedBy" | "lastUpdatedAt">) => {
    try {
      // Validate the item before adding
      const validation = validateInventoryItem(newItem);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      
      const item = {
        ...newItem,
        id: Math.random().toString(36).substr(2, 9),
        lastUpdatedBy: user ? user.username || user.name : 'Unknown',
        lastUpdatedAt: new Date().toISOString(),
      };

      // If offline, queue the operation for later sync
      if (!isOnline) {
        createOfflineItem('inventory', item);
      }
      
      const updatedInventory = [...inventory, item];
      setInventory(updatedInventory);
      saveInventoryToLocalStorage(updatedInventory);
      
      toast({
        title: "Success",
        description: isOnline 
          ? "Product added successfully" 
          : "Product added successfully (offline mode)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const updateItem = (id: string, updatedItem: InventoryItem) => {
    try {
      // Validate the item before updating
      const validation = validateInventoryItem(updatedItem);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      
      // If offline, queue the update operation
      if (!isOnline) {
        updateOfflineItem('inventory', id, updatedItem);
      }
      
      const newInventory = inventory.map(item => 
        item.id === id ? {
          ...updatedItem,
          lastUpdatedBy: user ? user.username || user.name : 'Unknown',
          lastUpdatedAt: new Date().toISOString(),
        } : item
      );
      
      setInventory(newInventory);
      saveInventoryToLocalStorage(newInventory);
      
      toast({
        title: "Success",
        description: isOnline 
          ? "Product updated successfully" 
          : "Product updated successfully (offline mode)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const deleteItem = (id: string) => {
    try {
      // If offline, queue the delete operation
      if (!isOnline) {
        deleteOfflineItem('inventory', id);
      }
      
      const newInventory = inventory.filter((item) => item.id !== id);
      setInventory(newInventory);
      saveInventoryToLocalStorage(newInventory);
      
      toast({
        title: "Success",
        description: isOnline 
          ? "Product deleted successfully" 
          : "Product deleted successfully (offline mode)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Batch operations
  const batchDelete = (ids: string[]) => {
    try {
      // If offline, queue each delete operation
      if (!isOnline) {
        ids.forEach(id => deleteOfflineItem('inventory', id));
      }
      
      const newInventory = inventory.filter((item) => !ids.includes(item.id));
      setInventory(newInventory);
      saveInventoryToLocalStorage(newInventory);
      
      toast({
        title: "Success",
        description: isOnline 
          ? `${ids.length} products deleted successfully`
          : `${ids.length} products deleted successfully (offline mode)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  // Get all categories for filtering
  const getCategories = (): string[] => {
    return getCategoriesUtil(inventory);
  };

  // Get expiring items
  const getExpiringItems = (daysThreshold: number = 90): InventoryItem[] => {
    return getExpiringItemsUtil(inventory, daysThreshold);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    if (!isOnline) {
      // Just reload from local storage in offline mode
      const savedInventory = loadInventoryFromLocalStorage();
      if (savedInventory) {
        setInventory(savedInventory);
      }
      
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Offline Mode",
          description: "Loaded inventory from local storage. Changes will sync when you're back online.",
        });
      }, 800);
      return;
    }
    
    // In a real app, this would fetch fresh data from the API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Refreshing Inventory",
        description: "Inventory data has been refreshed.",
      });
    }, 800);
  };

  const handlePrint = async () => {
    await printInventory(inventory, user ? user.username || user.name : 'Unknown');
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
