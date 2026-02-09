import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  Lock
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

import {
  ReportLayout,
  ReportFiltersBar,
  ReportSummaryCards,
  ReportDataTable,
  ReportExportPanel
} from "@/components/reports/shared";
import type { MetricCardData, ColumnDef, ExportColumn } from "@/components/reports/shared";
import { useReportFilters } from "@/hooks/reports/useReportFilters";
import { useReportsAuditLogs } from "@/hooks/reports/useReportsAudit";

const AuditLogReport = () => {
  // Filters
  const { filters, setFilters } = useReportFilters('audit-log-report', {
    startDate: subDays(new Date(), 7).toISOString(),
    endDate: new Date().toISOString(),
    searchQuery: '',
    status: 'all'
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter Change Handler (Resets page)
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const { data, isLoading } = useReportsAuditLogs({
    startDate: filters.startDate,
    endDate: filters.endDate,
    searchQuery: filters.searchQuery,
    status: filters.status,
    page,
    pageSize
  });

  const logs = data?.data || [];
  const totalCount = data?.count || 0;

  // Metrics (Note: Metrics usually need TOTAL counts, not just paginated page. 
  // Ideally we should have a separate stats hook, but for now we approximate or fetch stats separately? 
  // Or we accept metrics are only for "visible/fetched" page? 
  // Standard pattern: Separate stats query. 
  // For now, let's keep metrics based on current view OR remove them if misleading. 
  // BETTER: The metrics in this report were relying on fetched data. 
  // To be accurate with server side pagination, we would need a separate "stats" query.
  // For simplicity in this migration step, I will temporarily disable the client-side derived metrics 
  // or keep them just for the current page (which is less useful but safe). 
  // Actually, `useReportsAuditLogs` could return stats? 
  // Let's stick to "Current Page Stats" or remove misleading aggregate cards if they can't be accurate without full fetch.
  // I will mock them with "N/A" or "Page Stats" or keep them as "Visible Logs".
  // Decision: Keep them as "Visible Logs Analysis" for now to avoid creating another heavy query.)

  const failureCount = logs.filter(l => l.status === 'failed' || l.event_type.includes('FAILED') || l.event_type.includes('UNAUTHORIZED')).length;
  const securityEvents = logs.filter(l => ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_RESET'].includes(l.event_type)).length;

  const metrics: MetricCardData[] = [
    {
      title: 'Visible Events',
      value: logs.length,
      icon: Server,
      description: `Total found: ${totalCount}`,
      colorScheme: 'blue'
    },
    {
      title: 'Security Alerts (Page)',
      value: securityEvents,
      icon: Shield,
      description: 'On current page',
      colorScheme: securityEvents > 0 ? 'rose' : 'success'
    },
    {
      title: 'Failed Actions (Page)',
      value: failureCount,
      icon: AlertTriangle,
      description: 'On current page',
      colorScheme: failureCount > 0 ? 'orange' : 'success'
    },
    {
      title: 'Active Users (Page)',
      value: new Set(logs.map(l => l.user_email || l.user_id)).size,
      icon: Lock,
      description: 'Unique actors',
      colorScheme: 'violet'
    }
  ];

  // Columns
  const columns: ColumnDef<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (row) => <span className="font-mono text-xs">{format(new Date(row.created_at), 'MMM dd, HH:mm:ss')}</span>
    },
    {
      key: 'event',
      header: 'Event Type',
      cell: (row) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (row.event_type.includes('FAILED') || row.event_type.includes('UNAUTHORIZED')) variant = 'destructive';
        if (row.event_type.includes('LOGIN')) variant = 'secondary';

        return <Badge variant={variant} className="text-[10px]">{row.event_type.replace(/_/g, ' ')}</Badge>;
      }
    },
    {
      key: 'user',
      header: 'User',
      cell: (row) => <span className="text-sm font-medium">{row.user_email || row.user_id || 'System'}</span>
    },
    {
      key: 'action',
      header: 'Action / Details',
      cell: (row) => (
        <div className="flex flex-col max-w-[300px]">
          <span className="text-xs font-semibold">{row.action}</span>
          <span className="text-[10px] text-muted-foreground truncate">
            {row.error_message || (typeof row.details === 'string' ? row.details : JSON.stringify(row.details))}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => row.status === 'success'
        ? <CheckCircle className="h-4 w-4 text-green-500" />
        : <XCircle className="h-4 w-4 text-red-500" />
    }
  ];

  // Export - Note: Exporting only current page is default behavior with pagination unless we implement "Export All" which fetches everything.
  // The ReportExportPanel current accepts `data` array. 
  // Ideally we'd pass a "fetch all" function to it, but for now we export visible.
  const exportData = logs.map(row => ({
    timestamp: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
    event: row.event_type,
    user: row.user_email || row.user_id || 'System',
    action: row.action,
    status: row.status,
    details: JSON.stringify(row.details),
    error: row.error_message
  }));

  const exportColumns: ExportColumn[] = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'event', header: 'Event Type' },
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'status', header: 'Status' },
    { key: 'details', header: 'Details' },
    { key: 'error', header: 'Error' }
  ];

  return (
    <ReportLayout
      title="System Audit Log"
      description="Comprehensive security and operational logs"
      icon={Shield}
      isLoading={isLoading}
      emptyState={logs.length === 0 ? undefined : undefined}
      onRefresh={() => window.location.reload()} // Simplified refresh
    >
      <ReportFiltersBar
        reportId="audit-log-report"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableFilters={{
          dateRange: true,
          search: true
        }}
      />

      <ReportSummaryCards metrics={metrics} />

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
        reportName="System Audit Log (Page)"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export default AuditLogReport;
