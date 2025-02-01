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

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory, setInventory] = useState(mockInventory);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (newItem: Omit<typeof mockInventory[0], "id">) => {
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

  const handleDeleteItem = (id: string) => {
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

      // Create a hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      // Write content to iframe
      iframe.contentDocument?.write(printContent);
      iframe.contentDocument?.close();

      // Wait for images to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Print and remove iframe
      iframe.contentWindow?.print();

      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

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
            onDeleteItem={handleDeleteItem}
          />
        </CardContent>
      </Card>

      <AddInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddItem={handleAddItem}
      />
    </div>
  );
};

export default Inventory;