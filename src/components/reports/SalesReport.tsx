import { useMemo } from 'react';
import { ShoppingBag, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { NairaSign } from '@/components/icons/NairaSign';
import { format, subMonths, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend
} from '@/components/ui/chart';
import {
  ReportLayout,
  ReportFiltersBar,
  ReportSummaryCards,
  ReportChartPanel,
  ReportExportPanel
} from '@/components/reports/shared';
import type { MetricCardData, ExportColumn } from '@/components/reports/shared';
import { useReportFilters } from '@/hooks/reports/useReportFilters';
import { useReportsSales, useReportBranches } from '@/hooks/reports/useReportsData';

const SalesReport = () => {
  // Initialize filters with persistence
  const { filters, setFilters } = useReportFilters('sales-report', {
    startDate: subMonths(new Date(), 6).toISOString(),
    endDate: new Date().toISOString(),
    branchIds: ['all']
  });

  // Fetch data using shared hooks
  const { data: rawSales, isLoading: loading } = useReportsSales({
    startDate: filters.startDate || subMonths(new Date(), 6).toISOString(),
    endDate: filters.endDate || new Date().toISOString(),
    branchId: filters.branchIds?.[0] || 'all'
  });

  const { data: branches } = useReportBranches();

  // Calculate metrics and chart data (FINANCIAL LOGIC - DO NOT MODIFY)
  const { metrics, chartData, exportData } = useMemo(() => {
    if (!rawSales) return {
      metrics: [],
      chartData: [],
      exportData: []
    };

    let totalRevenue = 0;
    let totalCost = 0;
    let totalCash = 0;
    let totalPos = 0;
    let totalTransfer = 0;
    const monthlyData: Record<string, { revenue: number; profit: number; cost: number }> = {};

    rawSales.forEach(sale => {
      const monthKey = format(parseISO(sale.date), 'MMM yyyy');

      // Calculate sale cost
      const saleCost = sale.sales_items?.reduce((acc: number, item: any) => {
        const cost = Number(item.cost_price) || 0;
        return acc + (cost * item.quantity);
      }, 0) || 0;

      totalRevenue += Number(sale.total);
      totalCost += saleCost;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, profit: 0, cost: 0 };
      }
      monthlyData[monthKey].revenue += Number(sale.total);
      monthlyData[monthKey].cost += saleCost;
      monthlyData[monthKey].profit += (Number(sale.total) - saleCost);

      // Aggregate payment modes
      if (Array.isArray(sale.payment_methods)) {
        sale.payment_methods.forEach((p: any) => {
          if (p.mode === 'cash') totalCash += Number(p.amount);
          if (p.mode === 'pos') totalPos += Number(p.amount);
          if (p.mode === 'transfer') totalTransfer += Number(p.amount);
        });
      } else {
        totalCash += Number(sale.total);
      }
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const processedChartData = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      sales: values.revenue,
      profit: values.profit
    }));

    // Prepare metrics for summary cards
    const metricsData: MetricCardData[] = [
      {
        title: 'Total Revenue',
        value: `₦${totalRevenue.toLocaleString()}`,
        icon: NairaSign,
        description: filters.startDate && filters.endDate
          ? `${format(new Date(filters.startDate), 'MMM d')} - ${format(new Date(filters.endDate), 'MMM d, yyyy')}`
          : 'Last 6 months',
        trend: { value: 12, isPositive: true },
        colorScheme: 'primary'
      },
      {
        title: 'Gross Profit',
        value: `₦${profit.toLocaleString()}`,
        icon: TrendingUp,
        description: 'Total earnings',
        colorScheme: 'success'
      },
      {
        title: 'Net Margin',
        value: `${margin.toFixed(1)}%`,
        icon: Percent,
        description: 'Average margin',
        colorScheme: 'blue'
      },
      {
        title: 'Avg. Monthly Sales',
        value: `₦${(totalRevenue / (processedChartData.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        icon: TrendingDown,
        description: 'Per month average',
        colorScheme: 'violet'
      }
    ];

    // Prepare export data
    const exportRows = processedChartData.map(row => ({
      month: row.month,
      revenue: row.sales,
      profit: row.profit,
      margin: row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(2) + '%' : '0%'
    }));

    return {
      metrics: metricsData,
      chartData: processedChartData,
      exportData: exportRows
    };
  }, [rawSales, filters.startDate, filters.endDate]);

  const chartConfig = {
    sales: {
      label: 'Revenue (₦)',
      color: '#2563eb',
    },
    profit: {
      label: 'Gross Profit (₦)',
      color: '#10b981',
    }
  };

  const exportColumns: ExportColumn[] = [
    { key: 'month', header: 'Month' },
    { key: 'revenue', header: 'Revenue (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
    { key: 'profit', header: 'Profit (₦)', formatter: (val) => `₦${Number(val).toLocaleString()}` },
    { key: 'margin', header: 'Margin (%)' }
  ];

  return (
    <ReportLayout
      title="Sales Volume Report"
      description="Revenue and profit analysis over time"
      icon={ShoppingBag}
      isLoading={loading}
    >
      {/* Filters */}
      <ReportFiltersBar
        reportId="sales-report"
        filters={filters}
        onFiltersChange={setFilters}
        availableFilters={{
          dateRange: true,
          branch: true,
          search: false
        }}
        branches={branches || []}
      />

      {/* Summary Cards */}
      <ReportSummaryCards metrics={metrics} isLoading={loading} />

      {/* Chart Panel */}
      <ReportChartPanel
        title="Financial Performance"
        description="Revenue vs Profit Trend"
        chartType="area"
        defaultExpanded={true}
      >
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₦${value.toLocaleString()}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend />
              <Area
                type="monotone"
                dataKey="sales"
                name="Revenue"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Gross Profit"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorProfit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ReportChartPanel>

      {/* Export Panel */}
      <ReportExportPanel
        reportName="Sales Report"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default SalesReport;
