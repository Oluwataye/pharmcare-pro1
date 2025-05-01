
import { useState, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { inventory, addItem, updateItem, deleteItem, handleRefresh, handlePrint } = useInventory();

  // Simulate initial data loading
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefreshWithLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleRefresh();
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Inventory Management
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your pharmacy inventory, stock levels, and products
          </p>
        </div>
      </div>

      <InventoryStats inventory={inventory} />

      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="p-4 md:p-6">
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>
            View and manage all products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <InventoryToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={handleRefreshWithLoading}
            onAddItem={() => setDialogOpen(true)}
            onPrint={handlePrint}
          />
          <div className="responsive-table">
            <InventoryTable
              inventory={filteredInventory}
              onDeleteItem={deleteItem}
              onUpdateItem={updateItem}
            />
          </div>
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
