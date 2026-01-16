
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const TransactionsReport = () => {
  const [transactionData, setTransactionData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const start = subDays(today, 7);

      const { data } = await supabase
        .from('sales')
        .select('created_at')
        .gte('created_at', start.toISOString());

      if (data) {
        // Initialize last 7 days with 0
        // We use an array to preserve order
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i);
          last7Days.push({
            date: format(d, 'EEE'), // Mon, Tue...
            fullDate: format(d, 'yyyy-MM-dd'),
            transactions: 0
          });
        }

        // Fill counts
        data.forEach(sale => {
          const saleDate = format(new Date(sale.created_at), 'yyyy-MM-dd');
          const dayObj = last7Days.find(d => d.fullDate === saleDate);
          if (dayObj) {
            dayObj.transactions += 1;
          }
        });

        setTransactionData(last7Days);
      }
    };
    fetchData();
  }, []);

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
          <CardTitle>Daily Transactions (Last 7 Days)</CardTitle>
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
