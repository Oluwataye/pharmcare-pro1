
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  },
];

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  reorderLevel: number;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState(mockInventory);
  const { toast } = useToast();

  const addItem = (newItem: Omit<InventoryItem, "id">) => {
    const item = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
    };
    setInventory([...inventory, item]);
    toast({
      title: "Success",
      description: "Product added successfully",
    });
  };

  const updateItem = (id: string, updatedItem: InventoryItem) => {
    setInventory(inventory.map(item => 
      item.id === id ? updatedItem : item
    ));
    toast({
      title: "Success",
      description: "Product updated successfully",
    });
  };

  const deleteItem = (id: string) => {
    setInventory(inventory.filter((item) => item.id !== id));
    toast({
      title: "Success",
      description: "Product deleted successfully",
    });
  };

  const handleRefresh = () => {
    // In a real app, this would fetch fresh data from the API
    toast({
      title: "Refreshing Inventory",
      description: "Inventory data has been refreshed.",
    });
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
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
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
    addItem,
    updateItem,
    deleteItem,
    handleRefresh,
    handlePrint,
  };
};
