
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

const TransactionsReport = () => {
  // Mock data - replace with real data from your backend
  const transactionData = [
    { date: "Mon", transactions: 25 },
    { date: "Tue", transactions: 30 },
    { date: "Wed", transactions: 45 },
    { date: "Thu", transactions: 35 },
    { date: "Fri", transactions: 50 },
    { date: "Sat", transactions: 40 },
    { date: "Sun", transactions: 20 },
  ];

  const chartConfig = {
    transactions: {
      label: "Number of Transactions",
      color: "var(--primary)",
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="var(--primary)"
                    strokeWidth={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsReport;
