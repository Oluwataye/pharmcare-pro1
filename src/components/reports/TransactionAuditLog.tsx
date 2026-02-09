import { useState } from "react";
import { FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

import {
  ReportLayout,
  ReportFiltersBar,
  ReportDataTable,
  ReportExportPanel
} from "@/components/reports/shared";
import type { ColumnDef, ExportColumn } from "@/components/reports/shared";
import { useReportFilters } from "@/hooks/reports/useReportFilters";
import { useReportsAuditLogs } from "@/hooks/reports/useReportsAudit";
import { formatCurrency } from "@/lib/currency";

const TransactionAuditLog = () => {
  const { filters, setFilters } = useReportFilters('transaction-audit-log', {
    searchQuery: ''
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const { data, isLoading } = useReportsAuditLogs({
    ...filters,
    eventTypes: ['SALE_COMPLETED', 'REFUND_PROCESSED', 'EXPENSE_RECORDED', 'PAYMENT_RECEIVED'],
    page,
    pageSize
  });

  const logs = data?.data || [];
  const totalCount = data?.count || 0;

  const columns: ColumnDef<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (row) => format(new Date(row.created_at), 'MMM dd, HH:mm')
    },
    {
      key: 'user',
      header: 'User',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.user_email?.split('@')[0] || 'System'}</span>
          <span className="text-[10px] text-muted-foreground">{row.user_email}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => <span className="font-bold text-xs">{row.action.replace(/_/g, ' ')}</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (row) => {
        const det = typeof row.details === 'string' ? JSON.parse(row.details || '{}') : row.details;
        const amt = det?.amount || det?.total || 0;
        return amt ? <span className="font-mono">{formatCurrency(amt)}</span> : <span className="text-muted-foreground">-</span>;
      }
    },
    {
      key: 'details',
      header: 'Details',
      cell: (row) => {
        const det = typeof row.details === 'string' ? row.details : JSON.stringify(row.details);
        return <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={det}>{det}</span>;
      }
    }
  ];

  const exportData = logs.map(row => ({
    timestamp: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
    user: row.user_email,
    action: row.action,
    details: JSON.stringify(row.details)
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'details', header: 'Details' }
  ];

  return (
    <ReportLayout
      title="Transaction Audit Log"
      description="Trail of all financial modifications and events"
      icon={FileText}
      isLoading={isLoading}
      emptyState={logs.length === 0 ? undefined : undefined}
      onRefresh={() => window.location.reload()}
    >
      <ReportFiltersBar
        reportId="transaction-audit-log"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableFilters={{
          search: true
        }}
      />

      <ReportDataTable
        columns={columns}
        data={logs}
        totalRows={totalCount}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <ReportExportPanel
        reportName="Transaction Audit Log (Page)"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default TransactionAuditLog;
