
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/inventory";
import { mockInventory } from "@/utils/mockInventoryData";
import { saveInventoryToLocalStorage, loadInventoryFromLocalStorage } from "@/utils/inventoryUtils";
import { supabase } from "@/integrations/supabase/client";
import { useOffline } from "@/contexts/OfflineContext";

interface InventoryContextType {
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    handleRefresh: () => Promise<void>;
    fetchInventoryFromCloud: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>(() => {
        return loadInventoryFromLocalStorage() || mockInventory;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { isOnline } = useOffline();

    const fetchInventoryFromCloud = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log("Fetching inventory from Supabase...");
            const { data, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Debug: Log the raw data from Supabase
            console.log(`Supabase returned ${data?.length || 0} items.`);
            if (data && data.length > 0) {
                console.table(data.slice(0, 5)); // Log first 5 items to verify structure
            }

            const inventoryItems: InventoryItem[] = (data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                price: Number(item.price),
                costPrice: item.cost_price ? Number(item.cost_price) : undefined,
                reorderLevel: item.reorder_level,
                expiryDate: item.expiry_date || undefined,
                manufacturer: item.manufacturer || undefined,
                batchNumber: item.batch_number || undefined,
                supplierId: item.supplier_id || undefined,
                restockInvoiceNumber: item.restock_invoice_number || undefined,
                lastUpdatedBy: 'System',
                lastUpdatedAt: item.last_updated_at,
            }));

            setInventory(inventoryItems);
            saveInventoryToLocalStorage(inventoryItems);
        } catch (err: any) {
            console.error('Error fetching inventory:', err);
            setError(err.message);

            const savedInventory = loadInventoryFromLocalStorage();
            if (savedInventory) {
                setInventory(savedInventory);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
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
    }, [isOnline, fetchInventoryFromCloud, toast]);

    // Handle initial fetch and real-time subscription
    useEffect(() => {
        if (isOnline) {
            fetchInventoryFromCloud();
        }

        const channel = supabase
            .channel('inventory-global-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory'
                },
                (payload) => {
                    console.log("Real-time inventory change received:", payload.eventType);
                    if (isOnline) {
                        fetchInventoryFromCloud();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOnline, fetchInventoryFromCloud]);

    return (
        <InventoryContext.Provider
            value={{
                inventory,
                setInventory,
                isLoading,
                setIsLoading,
                error,
                setError,
                handleRefresh,
                fetchInventoryFromCloud
            }}
        >
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventoryContext = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error("useInventoryContext must be used within an InventoryProvider");
    }
    return context;
};
