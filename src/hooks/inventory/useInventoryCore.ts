import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/inventory";
import { mockInventory } from "@/utils/mockInventoryData";
import { saveInventoryToLocalStorage, loadInventoryFromLocalStorage } from "@/utils/inventoryUtils";
import { supabase } from "@/integrations/supabase/client";
import { useOffline } from "@/contexts/OfflineContext";

export const useInventoryCore = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    // Try to get saved inventory from localStorage first
    return loadInventoryFromLocalStorage() || mockInventory;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isOnline } = useOffline();

  // Fetch inventory from Supabase on mount
  useEffect(() => {
    if (isOnline) {
      fetchInventoryFromCloud();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          if (isOnline) {
            fetchInventoryFromCloud();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  const fetchInventoryFromCloud = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Convert database format to app format
      const inventoryItems: InventoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        price: Number(item.price),
        reorderLevel: item.reorder_level,
        expiryDate: item.expiry_date || undefined,
        manufacturer: item.manufacturer || undefined,
        batchNumber: item.batch_number || undefined,
        lastUpdatedBy: 'System',
        lastUpdatedAt: item.last_updated_at,
      }));

      setInventory(inventoryItems);
      saveInventoryToLocalStorage(inventoryItems);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message);
      
      // Fall back to localStorage data
      const savedInventory = loadInventoryFromLocalStorage();
      if (savedInventory) {
        setInventory(savedInventory);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh inventory while offline.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await fetchInventoryFromCloud();
      
      toast({
        title: "Inventory Refreshed",
        description: "Inventory data has been refreshed from the cloud.",
      });
    } catch (err: any) {
      toast({
        title: "Refresh Failed",
        description: err.message || "Failed to refresh inventory",
        variant: "destructive",
      });
    }
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
