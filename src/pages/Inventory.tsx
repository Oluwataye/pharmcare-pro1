
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
import { ExpiryWarningBanner } from "@/components/inventory/ExpiryWarningBanner";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    inventory, 
    addItem, 
    updateItem, 
    deleteItem, 
    batchDelete,
    getCategories,
    getExpiringItems,
    handleRefresh, 
    handlePrint 
  } = useInventory();

  // Get all categories for filtering
  const categories = getCategories();
  
  // Get expiring items
  const expiringItems = getExpiringItems(90);

  // Simulate initial data loading
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Apply filters (search and category)
  const filteredInventory = inventory.filter(
    (item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }
  );

  const handleRefreshWithLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleRefresh();
      setIsLoading(false);
    }, 800);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
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

      {expiringItems.length > 0 && <ExpiryWarningBanner expiringItems={expiringItems} />}

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
            categoryFilter={categoryFilter}
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onRefresh={handleRefreshWithLoading}
            onAddItem={() => setDialogOpen(true)}
            onPrint={handlePrint}
          />
          <div className="responsive-table">
            <InventoryTable
              inventory={filteredInventory}
              onDeleteItem={deleteItem}
              onUpdateItem={updateItem}
              onBatchDelete={batchDelete}
            />
          </div>
        </CardContent>
      </Card>

      <AddInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddItem={addItem}
        categories={categories}
      />
    </div>
  );
};

export default Inventory;
