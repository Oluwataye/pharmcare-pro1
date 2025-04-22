
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

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { inventory, addItem, updateItem, deleteItem, handleRefresh, handlePrint } = useInventory();

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onPrint={handlePrint}
          />
          <InventoryTable
            inventory={filteredInventory}
            onDeleteItem={deleteItem}
            onUpdateItem={updateItem}
          />
        </CardContent>
      </Card>

      <AddInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddItem={addItem}
      />
    </div>
  );
};

export default Inventory;
