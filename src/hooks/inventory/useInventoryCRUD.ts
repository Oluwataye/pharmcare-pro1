
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { InventoryItem } from "@/types/inventory";
import { validateInventoryItem, saveInventoryToLocalStorage } from "@/utils/inventoryUtils";
import { useInventoryCore } from "@/hooks/inventory/useInventoryCore";

export const useInventoryCRUD = () => {
  const { inventory, setInventory } = useInventoryCore();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { createOfflineItem, updateOfflineItem, deleteOfflineItem } = useOfflineData();

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

  return {
    addItem,
    updateItem,
    deleteItem,
    batchDelete,
  };
};
