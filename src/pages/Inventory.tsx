
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button
} from "@/components/ui/button";
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
import { useSuppliers } from "@/hooks/useSuppliers";
import { Spinner } from "@/components/ui/spinner";
import { ExpiryWarningBanner } from "@/components/inventory/ExpiryWarningBanner";
import { ExpiryNotificationBanner } from "@/components/notifications/ExpiryNotificationBanner";
import { StockMovementHistory } from "@/components/inventory/StockMovementHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Package, AlertTriangle, FileText } from "lucide-react";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
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
    handlePrint,
    adjustStock
  } = useInventory();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Apply filters (search, category, and supplier)
  const filteredInventory = inventory.filter(
    (item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplierId === supplierFilter;
      return matchesSearch && matchesCategory && matchesSupplier;
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

  const isFirstLoad = isLoading && inventory.length === 0;

  if (isFirstLoad) {
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

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory List
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Stock History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
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
                supplierFilter={supplierFilter}
                onSupplierChange={setSupplierFilter}
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
                  onAdjustStock={adjustStock}
                  onBatchDelete={batchDelete}
                  suppliers={suppliers}
                />
              </div>
            </CardContent>
          </EnhancedCard>
        </TabsContent>

        <TabsContent value="history">
          <EnhancedCard colorScheme="primary">
            <CardHeader>
              <CardTitle>Global Stock Movement History</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Audit log of all additions, adjustments, and sales</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/reports', { state: { activeTab: 'adjustments' } })}
                >
                  <FileText className="h-4 w-4" />
                  View Detailed Adjustment Summary
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementHistory limit={100} />
            </CardContent>
          </EnhancedCard>
        </TabsContent>
      </Tabs>

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

// No changes needed if file was already using it.
export default Inventory;
