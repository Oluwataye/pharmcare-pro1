import { useMemo } from "react";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  PieChart as PieChartIcon,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

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
import { useReportsInventoryValuation } from "@/hooks/reports/useReportsStock";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

const InventoryReport = () => {
  // Filters - mainly for search and branch (if applicable later)
  const { filters, setFilters } = useReportFilters('inventory-report', {
    searchQuery: ''
  });

  // Data Fetching
  const { data: inventory = [], isLoading } = useReportsInventoryValuation();

  // Process Data
  const processedData = useMemo(() => {
    let items = inventory;

    // Filter by search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      items = items.filter((i: any) =>
        i.name.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }

    const metrics = items.reduce((acc: any, item: any) => {
      const costVal = item.quantity * (item.cost_price || 0);
      const salesVal = item.quantity * (item.price || 0);

      acc.totalItems += 1;
      acc.totalQuantity += item.quantity;
      acc.totalCostValue += costVal;
      acc.totalSalesValue += salesVal;

      if (item.quantity <= (item.min_quantity || 10)) {
        acc.lowStockCount += 1;
      }
      if (item.quantity <= 0) {
        acc.outOfStockCount += 1;
      }

      // Category breakdown
      const cat = item.category || 'Uncategorized';
      if (!acc.categoryStats[cat]) {
        acc.categoryStats[cat] = { name: cat, value: 0, quantity: 0, items: 0 };
      }
      acc.categoryStats[cat].value += salesVal;
      acc.categoryStats[cat].quantity += item.quantity;
      acc.categoryStats[cat].items += 1;

      return acc;
    }, {
      totalItems: 0,
      totalQuantity: 0,
      totalCostValue: 0,
      totalSalesValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categoryStats: {} as Record<string, any>
    });

    const categoryData = Object.values(metrics.categoryStats)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8); // Top 8 by value

    return {
      filteredItems: items,
      ...metrics,
      categoryData
    };
  }, [inventory, filters.searchQuery]);

  // Metrics Configuration
  const metrics: MetricCardData[] = [
    {
      title: 'Inventory Value (Cost)',
      value: formatCurrency(processedData.totalCostValue),
      icon: DollarSign,
      description: 'Total investment cost',
      colorScheme: 'blue'
    },
    {
      title: 'Potential Revenue',
      value: formatCurrency(processedData.totalSalesValue),
      icon: HelperIcon, // Fallback icon managed below
      description: `Margin: ${processedData.totalSalesValue > 0 ? (((processedData.totalSalesValue - processedData.totalCostValue) / processedData.totalSalesValue) * 100).toFixed(1) : 0}%`,
      colorScheme: 'green'
    },
    {
      title: 'Low Stock Alerts',
      value: processedData.lowStockCount,
      icon: AlertTriangle,
      description: `${processedData.outOfStockCount} Out of stock`,
      colorScheme: processedData.lowStockCount > 0 ? 'orange' : 'success'
    },
    {
      title: 'Total SKUs',
      value: processedData.totalItems,
      icon: Package,
      description: `${processedData.totalQuantity.toLocaleString()} Units`,
      colorScheme: 'violet'
    }
  ];

  // Helper for dynamic icon
  function HelperIcon(props: any) {
    return <Layers {...props} />;
  }

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Product Name',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{row.sku}</span>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <Badge variant="outline">{row.category || 'Uncategorized'}</Badge>
    },
    {
      key: 'quantity',
      header: 'Stock Level',
      cell: (row) => {
        const isLow = row.quantity <= (row.min_quantity || 10);
        const isOut = row.quantity <= 0;
        return (
          <div className="flex flex-col gap-1 w-[100px]">
            <div className="flex justify-between text-xs">
              <span className={isOut ? 'text-red-600 font-bold' : isLow ? 'text-orange-600 font-bold' : 'text-green-600'}>
                {row.quantity} units
              </span>
            </div>
            <Progress value={Math.min((row.quantity / (row.max_quantity || 100)) * 100, 100)} className="h-1.5" />
          </div>
        );
      }
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      cell: (row) => <div className="text-right text-xs text-muted-foreground">{formatCurrency(row.cost_price || 0)}</div>
    },
    {
      key: 'price',
      header: 'Selling Price',
      cell: (row) => <div className="text-right font-medium">{formatCurrency(row.price || 0)}</div>
    },
    {
      key: 'value',
      header: 'Total Value',
      cell: (row) => <div className="text-right font-bold text-blue-600">{formatCurrency(row.quantity * (row.price || 0))}</div>
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        if (row.quantity <= 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
        if (row.quantity <= (row.min_quantity || 10)) return <Badge variant="outline" className="text-orange-600 border-orange-200 text-[10px] bg-orange-50">Low Stock</Badge>;
        return <Badge variant="outline" className="text-green-600 border-green-200 text-[10px] bg-green-50">In Stock</Badge>;
      }
    }
  ];

  // Export Data
  const exportData = processedData.filteredItems.map((row: any) => ({
    sku: row.sku,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    cost: row.cost_price,
    price: row.price,
    total_cost_val: row.quantity * (row.cost_price || 0),
    total_sales_val: row.quantity * (row.price || 0),
    status: row.quantity <= 0 ? 'Out of Stock' : row.quantity <= (row.min_quantity || 10) ? 'Low Stock' : 'In Stock'
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Qty' },
    { key: 'cost', header: 'Cost (₦)', formatter: (val) => formatCurrency(Number(val)) },
    { key: 'price', header: 'Price (₦)', formatter: (val) => formatCurrency(Number(val)) },
    { key: 'total_cost_val', header: 'Total Cost Val (₦)', formatter: (val) => formatCurrency(Number(val)) },
    { key: 'total_sales_val', header: 'Total Sales Val (₦)', formatter: (val) => formatCurrency(Number(val)) },
    { key: 'status', header: 'Status' }
  ];

  return (
    <ReportLayout
      title="Inventory Valuation Report"
      description="Comprehensive analysis of stock value, composition, and health"
      icon={Package}
      isLoading={isLoading}
      emptyState={inventory.length === 0 ? (
        <div className="text-center py-10">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p>No inventory items found</p>
        </div>
      ) : undefined}
      onRefresh={() => window.location.reload()}
    >
      <ReportFiltersBar
        reportId="inventory-report"
        filters={filters}
        onFiltersChange={setFilters}
        availableFilters={{
          search: true
        }}
      />

      <ReportSummaryCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartPanel
          title="Value by Category (Top 8)"
          description="Distribution of potential revenue by category"
          chartType="pie"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData.categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {processedData.categoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartPanel>

        <ReportChartPanel
          title="Stock Volume by Category"
          description="Physical quantity distribution"
          chartType="bar"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData.categoryData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={10} />
              <YAxis dataKey="name" type="category" width={100} fontSize={10} />
              <Tooltip formatter={(val: number) => val.toLocaleString() + ' units'} />
              <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartPanel>
      </div>

      <ReportDataTable
        columns={columns}
        data={processedData.filteredItems}
        pageSize={20}
      />

      <ReportExportPanel
        reportName="Inventory Valuation Report"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default InventoryReport;
