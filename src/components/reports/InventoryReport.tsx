
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useInventory } from "@/hooks/useInventory";

const InventoryReport = () => {
  const { inventory } = useInventory();

  const inventoryData = useMemo(() => {
    const grouped = inventory.reduce((acc: Record<string, number>, item) => {
      const category = item.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + item.quantity;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([category, stock]) => ({ category, stock }))
      .sort((a, b) => b.stock - a.stock) // Sort by stock desc
      .slice(0, 10); // Top 10 categories
  }, [inventory]);

  const chartConfig = {
    stock: {
      label: "Stock Level",
      color: "var(--primary)",
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Stock Levels by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {inventoryData.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Bar
                      dataKey="stock"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No inventory data available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
