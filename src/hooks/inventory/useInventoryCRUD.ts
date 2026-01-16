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

  const logStockMovement = async (params: {
    productId: string;
    quantityChange: number;
    prevQuantity: number;
    newQuantity: number;
    type: 'SALE' | 'ADJUSTMENT' | 'ADDITION' | 'RETURN' | 'INITIAL';
    reason?: string;
    referenceId?: string;
  }) => {
    if (!isOnline || !user) return;

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: params.productId,
          quantity_change: params.quantityChange,
          previous_quantity: params.prevQuantity,
          new_quantity: params.newQuantity,
          type: params.type,
          reason: params.reason,
          reference_id: params.referenceId,
          created_by: user.id
        });

      if (error) {
        console.error('Failed to log stock movement:', error);
      }
    } catch (err) {
      console.error('Error logging stock movement:', err);
    }
  };

  const addItem = async (newItem: Omit<InventoryItem, "id" | "lastUpdatedBy" | "lastUpdatedAt">) => {
    console.log("[useInventoryCRUD] Pulse: ===== addItem START =====");
    console.log("[useInventoryCRUD] Pulse: Product name:", newItem.name);
    console.log("[useInventoryCRUD] Pulse: Context state:", { isOnline, userId: user?.id, userRole: user?.role });

    try {
      // Validate the item before adding
      console.log("[useInventoryCRUD] Pulse: Step 1 - Validating item...");
      const validation = validateInventoryItem(newItem);
      if (!validation.valid) {
        console.warn("[useInventoryCRUD] Pulse: Validation failed:", validation.message);
        toast({
          title: "Validation Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      console.log("[useInventoryCRUD] Pulse: Step 1 - Validation passed ✓");

      console.log("[useInventoryCRUD] Pulse: Step 2 - Checking if online and user exists...");
      if (isOnline && user) {
        console.log("[useInventoryCRUD] Pulse: Step 2 - Online mode, proceeding with Supabase insert ✓");
        console.log("[useInventoryCRUD] Pulse: Step 3 - Preparing insert data...");

        const insertData = {
          name: newItem.name,
          sku: newItem.sku,
          category: newItem.category,
          quantity: newItem.quantity,
          unit: newItem.unit,
          price: newItem.price,
          cost_price: newItem.costPrice,
          reorder_level: newItem.reorderLevel,
          expiry_date: newItem.expiryDate || null,
          manufacturer: newItem.manufacturer || null,
          batch_number: newItem.batchNumber || null,
          supplier_id: newItem.supplierId === "none" ? null : newItem.supplierId,
          restock_invoice_number: newItem.restockInvoiceNumber || null,
          last_updated_by: user.id,
        };

        console.log("[useInventoryCRUD] Pulse: Step 3 - Insert data prepared ✓");
        console.log("[useInventoryCRUD] Pulse: Step 4 - Calling Supabase insert...");

        const { data, error } = await supabase
          .from('inventory')
          .insert(insertData)
          .select()
          .single();

        console.log("[useInventoryCRUD] Pulse: Step 4 - Supabase call completed");
        console.log("[useInventoryCRUD] Pulse: Step 4 - Has error:", !!error);
        console.log("[useInventoryCRUD] Pulse: Step 4 - Has data:", !!data);

        if (error) {
          console.error('[useInventoryCRUD] Pulse: ❌ Supabase insert error!', error);
          console.error('[useInventoryCRUD] Pulse: Error code:', error.code);
          console.error('[useInventoryCRUD] Pulse: Error message:', error.message);
          console.error('[useInventoryCRUD] Pulse: Error details:', JSON.stringify(error, null, 2));
          throw error;
        }

        console.log("[useInventoryCRUD] Pulse: Step 5 - ✅ Supabase insert successful! ID:", data.id);

        // Log the initial stock movement
        console.log("[useInventoryCRUD] Pulse: Step 6 - Logging initial stock movement...");
        await logStockMovement({
          productId: data.id,
          quantityChange: data.quantity,
          prevQuantity: 0,
          newQuantity: data.quantity,
          type: 'INITIAL',
          reason: 'Initial stock entry'
        });

        console.log("[useInventoryCRUD] Pulse: Step 6 - Stock movement logged ✓");
        console.log("[useInventoryCRUD] Pulse: Step 7 - Converting database format to app format...");

        // Convert database format to app format
        const item: InventoryItem = {
          id: data.id,
          name: data.name,
          sku: data.sku,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          price: Number(data.price),
          costPrice: data.cost_price ? Number(data.cost_price) : undefined,
          reorderLevel: data.reorder_level,
          expiryDate: data.expiry_date || undefined,
          manufacturer: data.manufacturer || undefined,
          batchNumber: data.batch_number || undefined,
          supplierId: data.supplier_id || undefined,
          restockInvoiceNumber: data.restock_invoice_number || undefined,
          lastUpdatedBy: user.username || user.name,
          lastUpdatedAt: data.last_updated_at,
        };

        console.log("[useInventoryCRUD] Pulse: Step 7 - Format conversion complete ✓");
        console.log("[useInventoryCRUD] Pulse: Step 8 - Updating local state...");

        const updatedInventory = [...inventory, item];
        setInventory(updatedInventory);
        saveInventoryToLocalStorage(updatedInventory);

        console.log("[useInventoryCRUD] Pulse: Step 8 - Local state updated ✓");
      } else {
        // Offline mode - use local storage
        console.log("[useInventoryCRUD] Pulse: Step 2 - OFFLINE mode detected");
        console.log("[useInventoryCRUD] Pulse: Adding in OFFLINE mode...");
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
        console.log("[useInventoryCRUD] Pulse: Offline item added ✓");
      }

      console.log("[useInventoryCRUD] Pulse: Step 9 - Showing success toast...");
      toast({
        title: "Success",
        description: isOnline
          ? "Product added successfully"
          : "Product added successfully (offline mode)",
      });
      console.log("[useInventoryCRUD] Pulse: ===== addItem COMPLETE ✅ =====");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to add product";
      console.error('[useInventoryCRUD] Pulse: ===== addItem FAILED ❌ =====');
      console.error('[useInventoryCRUD] Pulse: Error caught:', error);
      console.error('[useInventoryCRUD] Pulse: Error message:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw so callers know it failed
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
            cost_price: updatedItem.costPrice,
            reorder_level: updatedItem.reorderLevel,
            expiry_date: updatedItem.expiryDate || null,
            manufacturer: updatedItem.manufacturer || null,
            batch_number: updatedItem.batchNumber || null,
            supplier_id: updatedItem.supplierId === "none" ? null : updatedItem.supplierId,
            restock_invoice_number: updatedItem.restockInvoiceNumber || null,
            last_updated_by: user.id,
          })
          .eq('id', id);

        if (error) throw error;

        // Log movement if quantity changed
        const oldItem = inventory.find(i => i.id === id);
        if (oldItem && oldItem.quantity !== updatedItem.quantity) {
          const diff = updatedItem.quantity - oldItem.quantity;
          await logStockMovement({
            productId: id,
            quantityChange: diff,
            prevQuantity: oldItem.quantity,
            newQuantity: updatedItem.quantity,
            type: diff > 0 ? 'ADDITION' : 'ADJUSTMENT',
            reason: diff > 0 ? 'Stock addition' : 'Manual adjustment'
          });
        }
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

  const adjustStock = async (id: string, newQuantity: number, reason: string) => {
    try {
      const item = inventory.find(i => i.id === id);
      if (!item) throw new Error("Item not found");

      const diff = newQuantity - item.quantity;
      if (diff === 0) return;

      if (isOnline && user) {
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            last_updated_by: user.id,
          })
          .eq('id', id);

        if (error) throw error;

        await logStockMovement({
          productId: id,
          quantityChange: diff,
          prevQuantity: item.quantity,
          newQuantity: newQuantity,
          type: 'ADJUSTMENT',
          reason: reason
        });
      } else {
        updateOfflineItem('inventory', id, { ...item, quantity: newQuantity });
      }

      const newInventory = inventory.map(i =>
        i.id === id ? {
          ...i,
          quantity: newQuantity,
          lastUpdatedBy: user ? user.username || user.name : 'Unknown',
          lastUpdatedAt: new Date().toISOString(),
        } : i
      );

      setInventory(newInventory);
      saveInventoryToLocalStorage(newInventory);

      toast({
        title: "Success",
        description: `Stock adjusted by ${diff > 0 ? '+' : ''}${diff}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to adjust stock",
        variant: "destructive",
      });
    }
  };

  return {
    addItem,
    updateItem,
    deleteItem,
    batchDelete,
    adjustStock,
  };
};
