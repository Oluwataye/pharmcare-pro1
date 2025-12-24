import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { InventoryItem } from "@/types/inventory";
import { validateInventoryItem, saveInventoryToLocalStorage } from "@/utils/inventoryUtils";
import { useInventoryCore } from "@/hooks/inventory/useInventoryCore";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryCRUD = () => {
  const { inventory, setInventory } = useInventoryCore();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { createOfflineItem, updateOfflineItem, deleteOfflineItem } = useOfflineData();

  const addItem = async (newItem: Omit<InventoryItem, "id" | "lastUpdatedBy" | "lastUpdatedAt">) => {
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

      // If online, save to Supabase
      if (isOnline && user) {
        const { data, error } = await supabase
          .from('inventory')
          .insert({
            name: newItem.name,
            sku: newItem.sku,
            category: newItem.category,
            quantity: newItem.quantity,
            unit: newItem.unit,
            price: newItem.price,
            reorder_level: newItem.reorderLevel,
            expiry_date: newItem.expiryDate || null,
            manufacturer: newItem.manufacturer || null,
            batch_number: newItem.batchNumber || null,
            last_updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Convert database format to app format
        const item: InventoryItem = {
          id: data.id,
          name: data.name,
          sku: data.sku,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          price: Number(data.price),
          reorderLevel: data.reorder_level,
          expiryDate: data.expiry_date || undefined,
          manufacturer: data.manufacturer || undefined,
          batchNumber: data.batch_number || undefined,
          lastUpdatedBy: user.username || user.name,
          lastUpdatedAt: data.last_updated_at,
        };

        const updatedInventory = [...inventory, item];
        setInventory(updatedInventory);
        saveInventoryToLocalStorage(updatedInventory);
      } else {
        // Offline mode - use local storage
        const item = {
          ...newItem,
          id: Math.random().toString(36).substr(2, 9),
          lastUpdatedBy: user ? user.username || user.name : 'Unknown',
          lastUpdatedAt: new Date().toISOString(),
        };

        createOfflineItem('inventory', item);
        
        const updatedInventory = [...inventory, item];
        setInventory(updatedInventory);
        saveInventoryToLocalStorage(updatedInventory);
      }
      
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

  const updateItem = async (id: string, updatedItem: InventoryItem) => {
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

      // If online, update in Supabase
      if (isOnline && user) {
        const { error } = await supabase
          .from('inventory')
          .update({
            name: updatedItem.name,
            sku: updatedItem.sku,
            category: updatedItem.category,
            quantity: updatedItem.quantity,
            unit: updatedItem.unit,
            price: updatedItem.price,
            reorder_level: updatedItem.reorderLevel,
            expiry_date: updatedItem.expiryDate || null,
            manufacturer: updatedItem.manufacturer || null,
            batch_number: updatedItem.batchNumber || null,
            last_updated_by: user.id,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Offline mode
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

  const deleteItem = async (id: string) => {
    try {
      // If online, delete from Supabase
      if (isOnline) {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        // Offline mode
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

  const batchDelete = async (ids: string[]) => {
    try {
      // If online, delete from Supabase
      if (isOnline) {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .in('id', ids);

        if (error) throw error;
      } else {
        // Offline mode
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
