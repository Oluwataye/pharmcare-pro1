
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogEntry } from "@/types/sales";

// Mock audit log data - in a real application, this would come from an API
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "1",
    userId: "1",
    username: "admin",
    email: "admin@demo.com",
    action: "SALE_COMPLETED",
    resource: "sales",
    resourceId: "sale-123",
    details: "Completed sale of 3 items for ₦4500",
    timestamp: new Date("2025-04-22T10:30:00")
  },
  {
    id: "2",
    userId: "3",
    username: "cashier1",
    email: "cashier@demo.com",
    action: "SALE_COMPLETED",
    resource: "sales",
    resourceId: "sale-124",
    details: "Completed sale of 1 item for ₦1500",
    timestamp: new Date("2025-04-22T11:15:00")
  },
  {
    id: "3",
    userId: "2",
    username: "pharmacist1",
    email: "pharmacist@demo.com",
    action: "INVENTORY_UPDATED",
    resource: "inventory",
    resourceId: "item-456",
    details: "Updated stock for Paracetamol to 200 units",
    timestamp: new Date("2025-04-22T09:45:00")
  }
];

const TransactionAuditLog = () => {
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
            {mockAuditLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="font-medium">{log.username}</div>
                  <div className="text-sm text-muted-foreground">{log.email}</div>
                </TableCell>
                <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransactionAuditLog;
