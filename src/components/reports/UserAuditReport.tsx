
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UserAuditReport = () => {
  // Mock data - replace with real data from your backend
  const auditLogs = [
    {
      id: 1,
      user: "John Doe",
      action: "Login",
      timestamp: "2024-04-15 10:30 AM",
      details: "Successfully logged in",
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "Inventory Update",
      timestamp: "2024-04-15 11:15 AM",
      details: "Updated stock for Paracetamol",
    },
    {
      id: 3,
      user: "Admin User",
      action: "User Creation",
      timestamp: "2024-04-15 12:00 PM",
      details: "Created new user account",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Activity Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAuditReport;
