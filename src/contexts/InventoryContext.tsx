
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/inventory";
import { saveInventoryToLocalStorage, loadInventoryFromLocalStorage } from "@/utils/inventoryUtils";
import { supabase } from "@/integrations/supabase/client";
import { useOffline } from "@/contexts/OfflineContext";
import { useAuth } from "@/contexts/AuthContext";

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
        return loadInventoryFromLocalStorage() || [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { isOnline } = useOffline();
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();

    const fetchInventoryFromCloud = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('inventory')
                .select('*, batches:inventory_batches(*)')
                .order('name', { ascending: true });

            if (fetchError) {
                throw new Error(`Failed to fetch inventory: ${fetchError.message}`);
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
                profitMargin: item.profit_margin ? Number(item.profit_margin) : undefined,
                reorderLevel: item.reorder_level,
                expiryDate: item.expiry_date || undefined,
                manufacturer: item.manufacturer || undefined,
                batchNumber: item.batch_number || undefined,
                supplierId: item.supplier_id || undefined,
                restockInvoiceNumber: item.restock_invoice_number || undefined,
                lastUpdatedBy: 'System',
                lastUpdatedAt: item.last_updated_at,
                batches: item.batches,
                multi_unit_config: item.multi_unit_config || []
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

    useEffect(() => {
        if (isOnline && isAuthenticated) {
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
                () => {
                    if (isOnline && isAuthenticated) {
                        fetchInventoryFromCloud();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOnline, isAuthenticated, authLoading, fetchInventoryFromCloud]);

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
