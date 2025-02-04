import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { AddInventoryDialog } from "@/components/inventory/AddInventoryDialog";
import { useInventory } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    inventory,
    isLoadingInventory,
    inventoryError,
    addItem,
    deleteItem,
    isAddingItem,
    isDeletingItem,
  } = useInventory();

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (newItem: any) => {
    addItem(newItem);
    setDialogOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
  };

  const handleRefresh = () => {
    window.location.reload();
    toast({
      title: "Refreshing Inventory",
      description: "Inventory data has been refreshed.",
    });
  };

  if (inventoryError) {
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          Error loading inventory. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Manage your pharmacy inventory, stock levels, and products
          </p>
        </div>
      </div>

      {isLoadingInventory ? (
        <div className="space-y-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[400px]" />
        </div>
      ) : (
        <>
          <InventoryStats inventory={inventory} />

          <Card>
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>
                View and manage all products in your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                onAddItem={() => setDialogOpen(true)}
                onPrint={() => window.print()}
              />
              <InventoryTable
                inventory={filteredInventory}
                onDeleteItem={handleDeleteItem}
              />
            </CardContent>
          </Card>

          <AddInventoryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onAddItem={handleAddItem}
          />
        </>
      )}
    </div>
  );
};

export default Inventory;