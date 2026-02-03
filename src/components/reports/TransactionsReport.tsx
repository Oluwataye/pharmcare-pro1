
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { useReportsSales } from "@/hooks/reports/useReportsData";

const TransactionsReport = () => {
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => subDays(today, 7).toISOString(), [today]);
  const end = useMemo(() => today.toISOString(), [today]);

  const { data: rawSales } = useReportsSales({
    startDate: start,
    endDate: end,
    branchId: 'all'
  });

  const transactionData = useMemo(() => {
    // Initialize last 7 days with 0
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      last7Days.push({
        date: format(d, 'EEE'), // Mon, Tue...
        fullDate: format(d, 'yyyy-MM-dd'),
        transactions: 0
      });
    }

    if (rawSales) {
      // Fill counts
      rawSales.forEach((sale: any) => {
        const saleDate = format(new Date(sale.created_at), 'yyyy-MM-dd');
        const dayObj = last7Days.find(d => d.fullDate === saleDate);
        if (dayObj) {
          dayObj.transactions += 1;
        }
      });
    }

    return last7Days;
  }, [rawSales, today]);

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
