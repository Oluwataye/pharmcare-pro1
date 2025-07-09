
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { UserPermissionsDialog } from "@/components/users/UserPermissionsDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { canManageUsers, canEditUsers, canDeleteUsers } = usePermissions();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([
    {
      id: "super-admin-001",
      name: "Super Administrator",
      email: "admin@pharmacarepro.com",
      username: "admin",
      role: "SUPER_ADMIN",
    },
  ]);
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    toast({
      title: "User Updated",
      description: `${updatedUser.name}'s profile has been updated successfully.`,
    });
  };

  const handleUserDeleted = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleAddUser = (user: User) => {
    setUsers([...users, user]);
    toast({
      title: "User added",
      description: "New user has been added successfully.",
    });
  };

  // Calculate user statistics for the cards
  const totalUsers = users.length;
  const activeUsers = users.length; // Assuming all users are active for this example
  const pharmacists = users.filter(user => user.role === "PHARMACIST").length;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">User Management</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-8 w-full" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canManageUsers() && (
            <AddUserDialog onUserAdded={handleAddUser} />
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pharmacists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacists}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg">User List</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="responsive-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "SUPER_ADMIN" 
                            ? "bg-purple-100 text-purple-800" 
                            : user.role === "PHARMACIST" 
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.username || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {canEditUsers() && (
                            <>
                              <EditUserDialog user={user} onUserUpdated={handleUserUpdated} />
                              <ResetPasswordDialog user={user} />
                            </>
                          )}
                          {canManageUsers() && (
                            <UserPermissionsDialog user={user} />
                          )}
                          {canDeleteUsers() && (
                            <DeleteUserDialog user={user} onUserDeleted={handleUserDeleted} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
