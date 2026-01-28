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
    costPrice?: number;
    unitPrice?: number;
  }) => {
    if (!isOnline || !user) return;

    try {
      const { error } = await supabase
        // @ts-ignore - Table types not generated yet
        .from('stock_movements')
        .insert({
          product_id: params.productId,
          quantity_change: params.quantityChange,
          previous_quantity: params.prevQuantity,
          new_quantity: params.newQuantity,
          type: params.type,
          reason: params.reason,
          reference_id: params.referenceId,
          created_by: user.id,
          cost_price_at_time: params.costPrice,
          unit_price_at_time: params.unitPrice
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

    // Auto-generate SKU if missing
    let itemToProcess = { ...newItem };
    if (!itemToProcess.sku || itemToProcess.sku.trim() === '') {
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
      const generatedSku = `SKU-${timestamp}-${randomPart}`;
      console.log("[useInventoryCRUD] Pulse: Auto-generating SKU:", generatedSku);
      itemToProcess.sku = generatedSku;
    }

    try {
      // Validate the item before adding
      console.log("[useInventoryCRUD] Pulse: Step 1 - Validating item...");
      const validation = validateInventoryItem(itemToProcess);
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

        // @ts-ignore - RPC types not generated yet
        const { data, error } = await supabase
          .rpc('add_new_inventory_item', {
            p_name: itemToProcess.name,
            p_sku: itemToProcess.sku,
            p_category: itemToProcess.category,
            p_quantity: itemToProcess.quantity,
            p_unit: itemToProcess.unit,
            p_price: itemToProcess.price,
            p_cost_price: itemToProcess.costPrice,
            p_reorder_level: itemToProcess.reorderLevel,
            p_expiry_date: itemToProcess.expiryDate,
            p_manufacturer: itemToProcess.manufacturer,
            p_batch_number: itemToProcess.batchNumber, // NOW MANDATORY
            p_supplier_id: itemToProcess.supplierId === "none" ? null : itemToProcess.supplierId,
            p_restock_invoice_number: itemToProcess.restockInvoiceNumber,
            p_user_id: user.id
          });

        console.log("[useInventoryCRUD] Pulse: Step 4 - RPC call completed");
        console.log("[useInventoryCRUD] Pulse: Has error:", !!error);

        if (error) {
          console.error('[useInventoryCRUD] Pulse: ❌ RPC error!', error);
          throw error;
        }

        const newId = (data as any).id;
        console.log("[useInventoryCRUD] Pulse: Step 5 - ✅ RPC successful! ID:", newId);

        // No manual logStockMovement needed, RPC handles it

        console.log("[useInventoryCRUD] Pulse: Step 7 - Formatting for local state...");

        // Construct complete item for local state
        const item: InventoryItem = {
          id: newId,
          name: itemToProcess.name,
          sku: itemToProcess.sku,
          category: itemToProcess.category,
          quantity: itemToProcess.quantity,
          unit: itemToProcess.unit,
          price: itemToProcess.price,
          costPrice: itemToProcess.costPrice,
          reorderLevel: itemToProcess.reorderLevel,
          expiryDate: itemToProcess.expiryDate,
          manufacturer: itemToProcess.manufacturer,
          batchNumber: itemToProcess.batchNumber,
          supplierId: itemToProcess.supplierId === "none" ? undefined : itemToProcess.supplierId,
          restockInvoiceNumber: itemToProcess.restockInvoiceNumber,
          lastUpdatedBy: user.username || user.name,
          lastUpdatedAt: new Date().toISOString(),
          batches: [{
            id: (data as any).batch_id,
            batchNumber: itemToProcess.batchNumber!,
            expiryDate: itemToProcess.expiryDate!,
            quantity: itemToProcess.quantity,
            costPrice: itemToProcess.costPrice
          }]
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
          ...itemToProcess,
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
            reason: diff > 0
              ? (updatedItem.restockInvoiceNumber
                ? `Stock addition - Invoice: ${updatedItem.restockInvoiceNumber}`
                : 'Stock addition')
              : 'Manual adjustment',
            costPrice: updatedItem.costPrice,
            unitPrice: updatedItem.price
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
          reason: reason,
          costPrice: item.costPrice,
          unitPrice: item.price
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
