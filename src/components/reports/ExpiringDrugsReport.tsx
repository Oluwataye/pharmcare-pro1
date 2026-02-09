import * as React from 'react';
import { Calendar, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ReportLayout,
  ReportSummaryCards,
  ReportDataTable,
  ReportExportPanel
} from '@/components/reports/shared';
import type { MetricCardData, ColumnDef, ExportColumn } from '@/components/reports/shared';
import { useInventory, InventoryItem } from '@/hooks/useInventory';

const ExpiringDrugsReport = () => {
  const [filterDays, setFilterDays] = React.useState<number>(90);
  const { inventory, getExpiringItems } = useInventory();

  // Get expiring items based on the selected filter
  const expiringItems = getExpiringItems(filterDays);

  // Calculate statistics
  const totalExpiring = expiringItems.length;
  const criticalExpiring = getExpiringItems(30).length;
  const percentageExpiring = inventory.length > 0 ? (totalExpiring / inventory.length * 100) : 0;

  // Filter options for expiry timeframes
  const filterOptions = [
    { label: 'Next 30 days', value: 30 },
    { label: 'Next 90 days', value: 90 },
    { label: 'Next 180 days', value: 180 },
    { label: 'Next 365 days', value: 365 },
  ];

  // Calculate days remaining
  const calculateDaysRemaining = (expiryDateString: string | undefined): number => {
    if (!expiryDateString) return 0;
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Prepare metrics for summary cards
  const metrics: MetricCardData[] = [
    {
      title: 'Total Expiring',
      value: totalExpiring,
      icon: Package,
      description: `In next ${filterDays} days`,
      colorScheme: 'primary'
    },
    {
      title: 'Critical Items',
      value: criticalExpiring,
      icon: AlertTriangle,
      description: 'Expiring in 30 days',
      colorScheme: 'orange'
    },
    {
      title: '% of Inventory',
      value: `${percentageExpiring.toFixed(1)}%`,
      icon: Calendar,
      description: 'Expiring soon',
      colorScheme: 'blue'
    }
  ];

  // Prepare table columns
  const columns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Product Name',
      cell: (item) => <span className="font-medium">{item.name}</span>
    },
    {
      key: 'category',
      header: 'Category'
    },
    {
      key: 'batchNumber',
      header: 'Batch Number',
      cell: (item) => item.batchNumber || 'N/A'
    },
    {
      key: 'quantity',
      header: 'Quantity',
      cell: (item) => `${item.quantity} ${item.unit}`
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      cell: (item) => item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'
    },
    {
      key: 'daysRemaining',
      header: 'Days Remaining',
      cell: (item) => {
        const daysRemaining = calculateDaysRemaining(item.expiryDate);
        const severityClass = daysRemaining <= 30 ? 'text-red-600 font-medium' :
          daysRemaining <= 90 ? 'text-amber-600 font-medium' :
            'text-green-600 font-medium';
        return <span className={severityClass}>{daysRemaining} days</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => {
        const daysRemaining = calculateDaysRemaining(item.expiryDate);
        if (daysRemaining <= 30) {
          return <Badge variant="destructive" className="text-xs">Critical</Badge>;
        }
        if (daysRemaining <= 90) {
          return <Badge variant="default" className="text-xs bg-amber-500">Warning</Badge>;
        }
        return <Badge variant="default" className="text-xs bg-green-500">Upcoming</Badge>;
      }
    }
  ];

  // Prepare export data
  const exportData = expiringItems.map(item => ({
    name: item.name,
    category: item.category,
    batchNumber: item.batchNumber || 'N/A',
    quantity: `${item.quantity} ${item.unit}`,
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
    daysRemaining: calculateDaysRemaining(item.expiryDate),
    manufacturer: item.manufacturer || 'N/A',
    status: calculateDaysRemaining(item.expiryDate) <= 30 ? 'Critical' :
      calculateDaysRemaining(item.expiryDate) <= 90 ? 'Warning' : 'Upcoming'
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'batchNumber', header: 'Batch Number' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'expiryDate', header: 'Expiry Date' },
    { key: 'daysRemaining', header: 'Days Remaining' },
    { key: 'manufacturer', header: 'Manufacturer' },
    { key: 'status', header: 'Status' }
  ];

  // Custom filter component
  const customFilter = (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Expiry Timeframe:</label>
      <Select
        value={filterDays.toString()}
        onValueChange={(value) => setFilterDays(parseInt(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by timeframe" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Empty state
  const emptyState = (
    <Card>
      <CardContent className="pt-10 pb-10">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-lg font-medium">No expiring drugs found</p>
          <p className="text-sm text-muted-foreground">
            No products are expiring in the next {filterDays} days
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ReportLayout
      title="Expiring Drugs Report"
      description="Monitor products nearing expiry date"
      icon={AlertTriangle}
      emptyState={expiringItems.length === 0 ? emptyState : undefined}
    >
      {/* Custom Filter */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          {customFilter}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <ReportSummaryCards metrics={metrics} />

      {/* Data Table */}
      {expiringItems.length > 0 && (
        <>
          <ReportDataTable
            columns={columns}
            data={expiringItems}
            pageSize={50}
            emptyMessage={`No products expiring in the next ${filterDays} days`}
          />

          {/* Export Panel */}
          <ReportExportPanel
            reportName="Expiring Drugs Report"
            data={exportData}
            columns={exportColumns}
            filters={{ customFilter: `Timeframe: Next ${filterDays} days` }}
            formats={['csv', 'print']}
          />
        </>
      )}
    </ReportLayout>
  );
};

export default ExpiringDrugsReport;
