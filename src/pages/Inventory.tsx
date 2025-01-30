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
  const [inventory] = useState(mockInventory);
  const { toast } = useToast();

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Add inventory item functionality will be implemented soon.",
    });
  };

  const handleDeleteItem = (id: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Delete inventory item functionality will be implemented soon.",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing Inventory",
      description: "Inventory data has been refreshed.",
    });
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
            onAddItem={handleAddItem}
          />
          <InventoryTable
            inventory={filteredInventory}
            onDeleteItem={handleDeleteItem}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
