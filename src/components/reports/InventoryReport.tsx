import { useMemo, useState } from "react";
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
import { useReportsInventoryList, useReportsInventoryStats } from "@/hooks/reports/useReportsStock";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const InventoryReport = () => {
  const { user } = useAuth();

  // Filters
  const { filters, setFilters } = useReportFilters('inventory-report', {
    searchQuery: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Data Fetching
  const { data: listData, isLoading: loadingList } = useReportsInventoryList({
    searchQuery: filters.searchQuery,
    page,
    pageSize
  });

  const { data: statsItems = [], isLoading: loadingStats } = useReportsInventoryStats();

  const inventoryItems = listData?.data || [];
  const totalCount = listData?.count || 0;

  // Process Stats
  const processedStats = useMemo(() => {
    const metrics = statsItems.reduce((acc: any, item: any) => {
      const costVal = (item.quantity || 0) * (item.cost_price || 0);
      const salesVal = (item.quantity || 0) * (item.price || 0);

      acc.totalItems += 1;
      acc.totalQuantity += (item.quantity || 0);
      acc.totalCostValue += costVal;
      acc.totalSalesValue += salesVal;

      if ((item.quantity || 0) <= (item.min_quantity || 10)) {
        acc.lowStockCount += 1;
      }
      if ((item.quantity || 0) <= 0) {
        acc.outOfStockCount += 1;
      }

      // Category breakdown
      const cat = item.category || 'Uncategorized';
      if (!acc.categoryStats[cat]) {
        acc.categoryStats[cat] = { name: cat, value: 0, quantity: 0, items: 0 };
      }
      acc.categoryStats[cat].value += salesVal;
      acc.categoryStats[cat].quantity += (item.quantity || 0);
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
      .slice(0, 8);

    return {
      ...metrics,
      categoryData
    };
  }, [statsItems]);

  // Auth Check for Financials
  // Cost/Profit visible only to SUPER_ADMIN or ADMIN
  const canViewFinancials = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Metrics Configuration
  const metrics: MetricCardData[] = [
    {
      title: 'Inventory Value (Cost)',
      value: canViewFinancials ? formatCurrency(processedStats.totalCostValue) : '********',
      icon: DollarSign,
      description: canViewFinancials ? `Potential Sales: ${formatCurrency(processedStats.totalSalesValue)}` : 'Hidden for your role',
      colorScheme: 'success'
    },
    {
      title: 'Total Items',
      value: processedStats.totalItems.toLocaleString(),
      icon: Package,
      description: `${processedStats.categoryData.length} active categories`,
      colorScheme: 'blue'
    },
    {
      title: 'Low Stock Alerts',
      value: processedStats.lowStockCount.toString(),
      icon: AlertTriangle,
      description: `${processedStats.outOfStockCount} out of stock`,
      colorScheme: processedStats.lowStockCount > 0 ? 'orange' : 'success'
    },
    {
      title: 'Stock Proficiency',
      value: `${((1 - (processedStats.outOfStockCount / (processedStats.totalItems || 1))) * 100).toFixed(1)}%`,
      icon: Layers,
      description: 'In-stock rate',
      colorScheme: 'violet'
    }
  ];

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Product',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.name}</span>
          <span className="text-[10px] text-muted-foreground">SKU: {row.sku || '-'}</span>
        </div>
      )
    },
    {
      key: 'id_short',
      header: 'ID',
      cell: (row) => (
        <span className="font-mono text-[10px] text-muted-foreground">
          {(row.id || '').slice(0, 8)}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <Badge variant="outline" className="text-[10px]">{row.category || 'Uncategorized'}</Badge>
    },
    {
      key: 'stock',
      header: 'Stock Level',
      cell: (row) => {
        const isLow = row.quantity <= (row.min_quantity || 10);
        const isOut = row.quantity <= 0;
        let color = "bg-emerald-500";
        if (isLow) color = "bg-orange-500";
        if (isOut) color = "bg-red-500";

        return (
          <div className="w-[120px] flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className={isOut ? "text-red-600 font-bold" : ""}>{row.quantity} units</span>
            </div>
            <Progress value={Math.min(100, (row.quantity / (row.min_quantity * 3 || 30)) * 100)} className={`h-1.5`} indicatorClassName={color} />
          </div>
        );
      }
    },
    {
      key: 'cost',
      header: 'Cost Price',
      cell: (row) => <span className="font-mono text-xs">{formatCurrency(row.cost_price)}</span>,
      roleRestriction: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      key: 'value',
      header: 'Stock Value',
      cell: (row) => <span className="font-bold text-xs">{formatCurrency(row.quantity * row.cost_price)}</span>,
      roleRestriction: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        if (row.quantity <= 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
        if (row.quantity <= (row.min_quantity || 10)) return <Badge variant="secondary" className="text-orange-600 bg-orange-50 border-orange-200 text-[10px]">Low Stock</Badge>;
        return <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">In Stock</Badge>;
      }
    }
  ];

  // Export Data - Should we mask export too? Yes.
  // We can filter the export columns or map based on permission.
  // Simpler: Just exclude sensitive columns from export if not admin.
  // Actually, standard `ReportExportPanel` doesn't handle permission automatically yet.
  // We should conditionally exclude sensitive fields from `exportColumns`.

  const exportColumns: ExportColumn[] = [
    { key: 'name', header: 'Product Name' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Qty' },
    { key: 'status', header: 'Status' }
  ];

  if (canViewFinancials) {
    exportColumns.push(
      { key: 'cost', header: 'Unit Cost', formatter: (val) => formatCurrency(Number(val)) },
      { key: 'value', header: 'Total Value', formatter: (val) => formatCurrency(Number(val)) }
    );
  }

  const exportData = inventoryItems.map(row => {
    const base = {
      name: row.name,
      sku: row.sku,
      category: row.category,
      quantity: row.quantity,
      status: row.quantity <= 0 ? 'Out' : row.quantity <= (row.min_quantity || 10) ? 'Low' : 'OK'
    };
    if (canViewFinancials) {
      return {
        ...base,
        cost: row.cost_price,
        value: row.quantity * row.cost_price
      };
    }
    return base;
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <ReportLayout
      title="Inventory Valuation Report"
      description="Stock levels, valuation, and health metrics"
      icon={Package}
      isLoading={loadingList || loadingStats}
      onRefresh={() => window.location.reload()}
    >
      <ReportFiltersBar
        reportId="inventory-report"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableFilters={{
          search: true
        }}
      />

      <ReportSummaryCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChartPanel title="Value by Category" description="Top categories by potential sales value" chartType="bar">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedStats.categoryData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} fontSize={10} />
              <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartPanel>

        <ReportChartPanel title="Stock Concentration" description="Distribution of inventory value" chartType="pie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedStats.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {processedStats.categoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend iconSize={8} fontSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartPanel>
      </div>

      <ReportDataTable
        columns={columns}
        data={inventoryItems}
        totalRows={totalCount}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        title="Stock List"
      />

      <ReportExportPanel
        reportName="Inventory Report"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default InventoryReport;
