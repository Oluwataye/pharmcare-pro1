
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryToolbar } from "@/components/inventory/InventoryToolbar";
import { AddInventoryDialog } from "@/components/inventory/AddInventoryDialog";
import { BulkUploadDialog } from "@/components/inventory/BulkUploadDialog";
import { useInventory } from "@/hooks/useInventory";
import { Spinner } from "@/components/ui/spinner";
import { ExpiryWarningBanner } from "@/components/inventory/ExpiryWarningBanner";
import { ExpiryNotificationBanner } from "@/components/notifications/ExpiryNotificationBanner";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(true);
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
  const location = useLocation();

  // Get all categories for filtering
  const categories = getCategories();

  // Get expiring items
  const expiringItems = getExpiringItems(90);
  // Get critical items (30 days)
  const criticalItems = getExpiringItems(30);

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
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
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

  const handleDismissNotification = () => {
    setShowNotification(false);
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

      {criticalItems.length > 0 && showNotification && (
        <ExpiryNotificationBanner onDismiss={handleDismissNotification} />
      )}

      {expiringItems.length > 0 && <ExpiryWarningBanner expiringItems={expiringItems} />}

      <InventoryStats inventory={inventory} />

      <EnhancedCard className="z-10" colorScheme="primary">
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
            onBulkUpload={() => setBulkUploadOpen(true)}
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
      </EnhancedCard>

      <AddInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddItem={addItem}
        categories={categories}
      />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onUploadComplete={handleRefreshWithLoading}
      />
    </div>
  );
};

export default Inventory;
