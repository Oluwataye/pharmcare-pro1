import { useMemo } from "react";
import {
  Receipt,
  CreditCard,
  Wallet,
  Banknote,
  User,
  ArrowUpRight,
  Search
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

import {
  ReportLayout,
  ReportFiltersBar,
  ReportSummaryCards,
  ReportChartPanel,
  ReportDataTable,
  ReportExportPanel
} from "@/components/reports/shared";
import type { MetricCardData, ColumnDef, ExportColumn } from "@/components/reports/shared";
import { useReportFilters } from "@/hooks/reports/useReportFilters";
import { useReportsSales, useReportBranches } from "@/hooks/reports/useReportsData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, Area, AreaChart, ComposedChart, Bar } from "recharts";

const TransactionsReport = () => {
  // Filters
  const { filters, setFilters } = useReportFilters('transactions-report', {
    searchQuery: '',
    paymentModes: []
  });

  // Data Fetching
  const { data: branches = [] } = useReportBranches();
  const { data: rawSales, isLoading } = useReportsSales({
    startDate: filters.startDate!,
    endDate: filters.endDate!,
    branchId: filters.branchIds?.[0] || 'all'
  });

  // Process Data
  const processedData = useMemo(() => {
    if (!rawSales) return {
      filteredSales: [],
      metrics: {},
      chartData: [],
      paymentMethods: {}
    };

    let items = rawSales;

    // Filter by Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      items = items.filter((s: any) =>
        s.customer_name?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.profiles?.name?.toLowerCase().includes(q)
      );
    }

    // Filter by Payment Mode
    if (filters.paymentModes && filters.paymentModes.length > 0 && filters.paymentModes[0] !== 'all') {
      const mode = filters.paymentModes[0].toLowerCase();
      items = items.filter((s: any) =>
        // Check if payment_methods string/array contains the mode
        // Handling both string 'Cash' and JSON array/object cases if applicable
        // Assuming payment_methods is a string like "Cash" or JSON
        JSON.stringify(s.payment_methods).toLowerCase().includes(mode)
      );
    }

    // Aggregates
    const stats = items.reduce((acc: any, curr: any) => {
      const amount = Number(curr.total);
      acc.totalCount += 1;
      acc.totalValue += amount;

      // Payment Method Breakdown
      // Simple string check for now, robust handling depends on DB schema
      const method = String(curr.payment_methods || 'Unknown');
      if (method.includes('Cash')) acc.byMethod.cash += amount;
      if (method.includes('POS') || method.includes('Card')) acc.byMethod.pos += amount;
      if (method.includes('Transfer')) acc.byMethod.transfer += amount;

      // Chart Data Grouping
      const dateKey = format(parseISO(curr.date), 'yyyy-MM-dd');
      if (!acc.daily[dateKey]) {
        acc.daily[dateKey] = { date: dateKey, count: 0, value: 0 };
      }
      acc.daily[dateKey].count += 1;
      acc.daily[dateKey].value += amount;

      return acc;
    }, {
      totalCount: 0,
      totalValue: 0,
      byMethod: { cash: 0, pos: 0, transfer: 0 },
      daily: {} as Record<string, any>
    });

    const chartData = Object.values(stats.daily).sort((a: any, b: any) => new Date(a.date).getTime() - b.date);

    return {
      filteredSales: items,
      metrics: {
        totalCount: stats.totalCount,
        totalValue: stats.totalValue,
        avgTicket: stats.totalCount > 0 ? stats.totalValue / stats.totalCount : 0,
        byMethod: stats.byMethod
      },
      chartData
    };
  }, [rawSales, filters.searchQuery, filters.paymentModes]);

  // Metrics Configuration
  const metrics: MetricCardData[] = [
    {
      title: 'Total Transactions',
      value: processedData.metrics.totalCount?.toLocaleString() || '0',
      icon: Receipt,
      description: 'Processed Sales',
      colorScheme: 'blue'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(processedData.metrics.totalValue || 0),
      icon: Wallet,
      description: 'Gross Sales Value',
      colorScheme: 'green'
    },
    {
      title: 'Avg Ticket Value',
      value: formatCurrency(processedData.metrics.avgTicket || 0),
      icon: ArrowUpRight,
      description: 'Per transaction',
      colorScheme: 'violet'
    },
    {
      title: 'Cash vs Digital',
      value: `${((processedData.metrics.byMethod?.cash / (processedData.metrics.totalValue || 1)) * 100).toFixed(0)}% Cash`,
      icon: Banknote,
      description: 'vs POS/Transfer',
      colorScheme: 'orange'
    }
  ];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => format(parseISO(row.date), 'MMM dd, HH:mm')
    },
    {
      key: 'id',
      header: 'Receipt #',
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}...</span>
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.customer_name || 'Walk-in'}</span>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      cell: (row) => <span className="text-xs">{row.sales_items?.length || 0} items</span>
    },
    {
      key: 'amount',
      header: 'Total',
      cell: (row) => <span className="font-bold">{formatCurrency(row.total)}</span>
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (row) => {
        const method = String(row.payment_methods || 'Unknown');
        let variant: "default" | "secondary" | "outline" = "outline";
        let icon = <Banknote className="h-3 w-3 mr-1" />;

        if (method.includes('Transfer')) {
          variant = "secondary";
          icon = <ArrowUpRight className="h-3 w-3 mr-1" />;
        } else if (method.includes('POS')) {
          variant = "default";
          icon = <CreditCard className="h-3 w-3 mr-1" />;
        }

        return <Badge variant={variant} className="flex w-fit items-center">{icon} {method}</Badge>;
      }
    },
    {
      key: 'cashier',
      header: 'Cashier',
      cell: (row) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {row.profiles?.name || 'System'}
        </div>
      )
    }
  ];

  // Export Data
  const exportData = processedData.filteredSales.map((row: any) => ({
    date: format(parseISO(row.date), 'yyyy-MM-dd HH:mm'),
    receipt_id: row.id,
    customer: row.customer_name || 'Walk-in',
    items_count: row.sales_items?.length || 0,
    total: row.total,
    payment_method: row.payment_methods,
    cashier: row.profiles?.name || 'System'
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'date', header: 'Date' },
    { key: 'receipt_id', header: 'Receipt ID' },
    { key: 'customer', header: 'Customer' },
    { key: 'items_count', header: 'Items' },
    { key: 'total', header: 'Total', formatter: (val) => formatCurrency(Number(val)) },
    { key: 'payment_method', header: 'Payment Method' },
    { key: 'cashier', header: 'Cashier' }
  ];

  return (
    <ReportLayout
      title="Transactions Report"
      description="Detailed audit of sales transactions and receipts"
      icon={Receipt}
      isLoading={isLoading}
      emptyState={processedData.filteredSales.length === 0 ? undefined : undefined}
    >
      <ReportFiltersBar
        reportId="transactions-report"
        filters={filters}
        onFiltersChange={setFilters}
        availableFilters={{
          dateRange: true,
          branch: true,
          paymentMode: true,
          search: true
        }}
        branches={branches}
      />

      <ReportSummaryCards metrics={metrics} />

      <ReportChartPanel
        title="Transaction Trends"
        description="Daily transaction volume and revenue"
        chartType="composed"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData.chartData} margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => format(parseISO(val), 'MMM dd')}
              fontSize={12}
            />
            <YAxis yAxisId="left" fontSize={12} tickFormatter={(val) => `₦${val / 1000}k`} />
            <YAxis yAxisId="right" orientation="right" fontSize={12} />
            <Tooltip
              labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')}
              formatter={(value: any, name: string) => name === 'Revenue' ? formatCurrency(value) : value}
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="value" name="Revenue" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" />
            <Bar yAxisId="right" dataKey="count" name="Count" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </ReportChartPanel>

      <ReportDataTable
        columns={columns}
        data={processedData.filteredSales}
        pageSize={20}
        title="Transaction List"
      />

      <ReportExportPanel
        reportName="Transactions Report"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default TransactionsReport;
