import { useState } from "react";
import { User, Activity, Clock } from "lucide-react";
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

const UserAuditReport = () => {
  const { filters, setFilters } = useReportFilters('user-audit-report', {
    searchQuery: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const { data, isLoading } = useReportsAuditLogs({
    ...filters,
    page,
    pageSize
  });

  const logs = data?.data || [];
  const totalCount = data?.count || 0;

  // Columns
  const columns: ColumnDef<any>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.user_email || row.user_id || 'System'}</span>
            <span className="text-[10px] text-muted-foreground">{row.user_role || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => <span className="font-medium">{row.action.replace(/_/g, ' ')}</span>
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (row) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(row.created_at), 'MMM dd, HH:mm:ss')}
        </div>
      )
    },
    {
      key: 'details',
      header: 'Details',
      cell: (row) => {
        const det = typeof row.details === 'string' ? row.details : JSON.stringify(row.details);
        return <span className="text-xs truncate max-w-[300px] block" title={det}>{det}</span>;
      }
    }
  ];

  // Export Data
  const exportData = logs.map(row => ({
    timestamp: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
    user: row.user_email || row.user_id || 'System',
    role: row.user_role || 'N/A',
    action: row.action,
    details: typeof row.details === 'string' ? row.details : JSON.stringify(row.details)
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'user', header: 'User' },
    { key: 'role', header: 'Role' },
    { key: 'action', header: 'Action' },
    { key: 'details', header: 'Details' }
  ];

  return (
    <ReportLayout
      title="User Activity Audit"
      description="Recent user actions and system interactions"
      icon={Activity}
      isLoading={isLoading}
      emptyState={logs.length === 0 ? undefined : undefined}
      onRefresh={() => window.location.reload()}
    >
      <ReportFiltersBar
        reportId="user-audit-report"
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
        reportName="User Audit Report (Page)"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default UserAuditReport;
