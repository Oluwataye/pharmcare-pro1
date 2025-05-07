
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Enhanced inventory item type with expiry date and more fields
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  reorderLevel: number;
  expiryDate?: string; // Added expiry date tracking
  manufacturer?: string; // Added manufacturer info
  batchNumber?: string; // Added batch number for tracking
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

// Mock data - replace with actual API calls later
const mockInventory = [
  {
    id: "1",
    name: "Paracetamol",
    sku: "PCM001",
    category: "Pain Relief",
    quantity: 150,
    unit: "tablets",
    price: 500,
    reorderLevel: 30,
    expiryDate: "2026-01-15",
    manufacturer: "Emzor Pharmaceuticals",
    batchNumber: "PCM2023-001",
    lastUpdatedBy: "admin",
    lastUpdatedAt: new Date("2025-01-15").toISOString(),
  },
  {
    id: "2",
    name: "Amoxicillin",
    sku: "AMX002",
    category: "Antibiotics",
    quantity: 80,
    unit: "capsules",
    price: 1200,
    reorderLevel: 20,
    expiryDate: "2025-08-10",
    manufacturer: "GSK",
    batchNumber: "AMX2023-002",
    lastUpdatedBy: "pharmacist1",
    lastUpdatedAt: new Date("2025-02-10").toISOString(),
  },
];

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Enhanced validation for inventory items
  const validateItem = (item: Partial<InventoryItem>): { valid: boolean; message: string } => {
    if (!item.name || item.name.trim() === "") {
      return { valid: false, message: "Product name is required" };
    }
    if (!item.sku || item.sku.trim() === "") {
      return { valid: false, message: "SKU is required" };
    }
    if (!item.category || item.category.trim() === "") {
      return { valid: false, message: "Category is required" };
    }
    if (item.quantity === undefined || item.quantity < 0) {
      return { valid: false, message: "Quantity must be 0 or greater" };
    }
    if (item.price === undefined || item.price < 0) {
      return { valid: false, message: "Price must be 0 or greater" };
    }
    if (item.reorderLevel === undefined || item.reorderLevel < 0) {
      return { valid: false, message: "Reorder level must be 0 or greater" };
    }
    
    // Check if expiry date is valid if provided
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return { valid: false, message: "Invalid expiry date format" };
      }
    }
    
    return { valid: true, message: "" };
  };

  const addItem = (newItem: Omit<InventoryItem, "id" | "lastUpdatedBy" | "lastUpdatedAt">) => {
    try {
      // Validate the item before adding
      const validation = validateItem(newItem);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      
      const item = {
        ...newItem,
        id: Math.random().toString(36).substr(2, 9),
        lastUpdatedBy: user ? user.username || user.name : 'Unknown',
        lastUpdatedAt: new Date().toISOString(),
      };
      setInventory([...inventory, item]);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const updateItem = (id: string, updatedItem: InventoryItem) => {
    try {
      // Validate the item before updating
      const validation = validateItem(updatedItem);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      
      setInventory(inventory.map(item => 
        item.id === id ? {
          ...updatedItem,
          lastUpdatedBy: user ? user.username || user.name : 'Unknown',
          lastUpdatedAt: new Date().toISOString(),
        } : item
      ));
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const deleteItem = (id: string) => {
    try {
      setInventory(inventory.filter((item) => item.id !== id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Added batch operations
  const batchDelete = (ids: string[]) => {
    try {
      setInventory(inventory.filter((item) => !ids.includes(item.id)));
      toast({
        title: "Success",
        description: `${ids.length} products deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  // Added category filtering
  const getCategories = (): string[] => {
    const categories = inventory.map(item => item.category);
    return [...new Set(categories)].sort();
  };

  // Added expiry tracking
  const getExpiringItems = (daysThreshold: number = 90): InventoryItem[] => {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    return inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= thresholdDate && expiryDate >= today;
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    // In a real app, this would fetch fresh data from the API
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Refreshing Inventory",
        description: "Inventory data has been refreshed.",
      });
    }, 800);
  };

  const handlePrint = async () => {
    try {
      // Create print content
      const printContent = `
        <html>
          <head>
            <title>Inventory Report</title>
            <style>
              @media print {
                body { font-family: system-ui, -apple-system, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .header { text-align: center; margin-bottom: 20px; }
                @page { margin: 0.5cm; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Inventory Report</h1>
              <p>${new Date().toLocaleDateString()}</p>
              <p>Generated by: ${user ? user.username || user.name : 'Unknown'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Expiry Date</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                ${inventory
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.sku}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity} ${item.unit}</td>
                    <td>₦${item.price.toLocaleString()}</td>
                    <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    <td>${item.lastUpdatedBy || 'Unknown'} (${item.lastUpdatedAt ? new Date(item.lastUpdatedAt).toLocaleDateString() : 'N/A'})</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: "Success",
        description: "Inventory report sent to printer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print",
        variant: "destructive",
      });
    }
  };

  return {
    inventory,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    batchDelete,
    getCategories,
    getExpiringItems,
    handleRefresh,
    handlePrint,
  };
};
