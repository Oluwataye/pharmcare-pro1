import { Package, PackageOpen, TrendingUp } from "lucide-react";
import { EnhancedStatCard } from "@/components/admin/EnhancedStatCard";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  reorderLevel: number;
}

interface InventoryStatsProps {
  inventory: InventoryItem[];
}

export const InventoryStats = ({ inventory }: InventoryStatsProps) => {
  const lowStockCount = inventory.filter(
    (item) => item.quantity <= item.reorderLevel
  ).length;

  const totalValue = inventory.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleCardClick = (route: string) => {
    // Navigate logic or just do nothing if only for stats
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <EnhancedStatCard
        title="Total Products"
        value={inventory.length.toString()}
        icon={Package}
        trend=""
        trendUp={true}
        route="/inventory"
        onClick={handleCardClick}
        colorScheme="primary"
        comparisonLabel="Total inventory items"
      />
      <EnhancedStatCard
        title="Low Stock Items"
        value={lowStockCount.toString()}
        icon={PackageOpen}
        trend=""
        trendUp={false}
        route="/inventory"
        onClick={handleCardClick}
        colorScheme="warning"
        comparisonLabel="Requires attention"
      />
      <EnhancedStatCard
        title="Total Value"
        value={`₦${totalValue.toLocaleString()}`}
        icon={Package}
        trend=""
        trendUp={true}
        route="/inventory"
        onClick={handleCardClick}
        colorScheme="success"
        comparisonLabel="Estimated inventory value"
      />
    </div>
  );
};
