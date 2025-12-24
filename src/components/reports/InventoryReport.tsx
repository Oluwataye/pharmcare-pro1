
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const InventoryReport = () => {
  // Mock data - replace with real data from your backend
  const inventoryData = [
    { category: "Pain Relief", stock: 150 },
    { category: "Antibiotics", stock: 80 },
    { category: "Vitamins", stock: 200 },
    { category: "First Aid", stock: 120 },
    { category: "Chronic", stock: 90 },
  ];

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
