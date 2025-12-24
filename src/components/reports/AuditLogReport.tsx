import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  event_type: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  status: string;
  error_message: string | null;
  created_at: string;
}

const eventTypeColors: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-green-500/10 text-green-500 border-green-500/20',
  LOGIN_FAILED: 'bg-red-500/10 text-red-500 border-red-500/20',
  LOGOUT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  UNAUTHORIZED_ACCESS: 'bg-red-500/10 text-red-500 border-red-500/20',
  USER_CREATED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  USER_DELETED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  PASSWORD_RESET: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  SETTINGS_UPDATED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  DATA_EXPORTED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  DATA_DELETED: 'bg-red-500/10 text-red-500 border-red-500/20',
  SALE_COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  INVENTORY_UPDATED: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
};

export function AuditLogReport() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter as any);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter, statusFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search) ||
      log.event_type.toLowerCase().includes(search)
    );
  });

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const securityEvents = logs.filter(
    (log) =>
      log.event_type === 'LOGIN_FAILED' ||
      log.event_type === 'UNAUTHORIZED_ACCESS'
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit Log
            </CardTitle>
            <CardDescription>
              Track all security-sensitive operations in the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Alert Banner */}
        {securityEvents > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {securityEvents} security event{securityEvents > 1 ? 's' : ''} detected in recent logs
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, email, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
              <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="UNAUTHORIZED_ACCESS">Unauthorized Access</SelectItem>
              <SelectItem value="USER_CREATED">User Created</SelectItem>
              <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
              <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
              <SelectItem value="DATA_EXPORTED">Data Exported</SelectItem>
              <SelectItem value="DATA_DELETED">Data Deleted</SelectItem>
              <SelectItem value="SALE_COMPLETED">Sale Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={eventTypeColors[log.event_type] || 'bg-gray-500/10'}
                      >
                        {log.event_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_email || 'Unknown'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        <span className="text-xs">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {log.error_message || (log.resource_type ? `${log.resource_type}` : '-')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <p className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} entries. Audit logs are retained for 1 year.
        </p>
      </CardContent>
    </Card>
  );
}
