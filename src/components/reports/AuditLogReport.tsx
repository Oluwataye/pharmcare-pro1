import { useMemo } from "react";
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
    status: 'all',
    eventType: 'all' // Custom implementation needed in FiltersBar or mapped?
    // We will map a custom selector in FiltersBar if needed, or reused existing ones?
    // Actually ReportFiltersBar doesn't have "EventType" generic filter yet.
    // We can pass it as a custom filter or just ignore for now and use search + status.
    // Let's implement status and search for now, and rely on search for event types.
  });

  const { data: logs = [], isLoading } = useReportsAuditLogs({
    startDate: filters.startDate,
    endDate: filters.endDate,
    searchQuery: filters.searchQuery,
    status: filters.status,
    limit: 500
  });

  // Metrics
  const failureCount = logs.filter(l => l.status === 'failed' || l.event_type.includes('FAILED') || l.event_type.includes('UNAUTHORIZED')).length;
  const securityEvents = logs.filter(l => ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PASSWORD_RESET'].includes(l.event_type)).length;

  const metrics: MetricCardData[] = [
    {
      title: 'Total Events',
      value: logs.length,
      icon: Server,
      description: 'Logged actions',
      colorScheme: 'blue'
    },
    {
      title: 'Security Alerts',
      value: securityEvents,
      icon: Shield,
      description: 'Security related events',
      colorScheme: securityEvents > 0 ? 'rose' : 'success'
    },
    {
      title: 'Failed Actions',
      value: failureCount,
      icon: AlertTriangle,
      description: 'Errors or failures',
      colorScheme: failureCount > 0 ? 'orange' : 'success'
    },
    {
      title: 'Active Users',
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

  // Export
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
      onRefresh={() => window.location.reload()}
    >
      <ReportFiltersBar
        reportId="audit-log-report"
        filters={filters}
        onFiltersChange={setFilters}
        availableFilters={{
          dateRange: true,
          search: true,
          // Note: Adding a generic status filter to FiltersBar would be ideal in future, 
          // for now we can filter via search or add custom if strictly needed.
        }}
      />

      <ReportSummaryCards metrics={metrics} />

      <ReportDataTable
        columns={columns}
        data={logs}
        pageSize={50}
      />

      <ReportExportPanel
        reportName="System Audit Log"
        data={exportData}
        columns={exportColumns}
        filters={filters}
        formats={['csv', 'print']}
      />
    </ReportLayout>
  );
};

export function AuditLogReportWrapper() {
  return <AuditLogReport />;
}

export default AuditLogReport;
