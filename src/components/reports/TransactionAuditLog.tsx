
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogEntry } from "@/types/sales";
import { supabase } from "@/integrations/supabase/client";

const TransactionAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setLogs(data.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          username: log.user_email?.split('@')[0] || 'System', // Derive username
          email: log.user_email || '',
          action: log.action,
          resource: log.resource_type || '',
          resourceId: log.resource_id,
          details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
          timestamp: new Date(log.created_at)
        })));
      }
    };
    fetchLogs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{log.username}</div>
                    <div className="text-sm text-muted-foreground">{log.email}</div>
                  </TableCell>
                  <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                  <TableCell className="max-w-md truncate" title={log.details}>{log.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransactionAuditLog;
