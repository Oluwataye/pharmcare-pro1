import { useState, useEffect, useMemo } from "react";
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
import { Search, Users as UsersIcon, ShieldCheck, UserCog, UserCheck, Activity } from "lucide-react";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { UserPermissionsDialog } from "@/components/users/UserPermissionsDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedStatCard } from "@/components/admin/EnhancedStatCard";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { useUsers } from "@/hooks/useUsers";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { canManageUsers, canEditUsers, canDeleteUsers } = usePermissions();
  const { toast } = useToast();

  // Use the optimized useUsers hook with caching
  const { users, isLoading, refetch } = useUsers();

  // Set up real-time subscription for profile changes
  useEffect(() => {
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('[Users] Profile changed, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Debounced search with useMemo for performance
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      (user.username && user.username.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const handleUserUpdated = (updatedUser: User) => {
    // Refetch to get latest data from database
    refetch();
    toast({
      title: "User Updated",
      description: `${updatedUser.name}'s profile has been updated successfully.`,
    });
  };

  const handleUserDeleted = (userId: string) => {
    // Refetch to get latest data from database
    refetch();
  };

  const handleAddUser = (user: User) => {
    // Refetch to get latest data from database
    refetch();
    toast({
      title: "User added",
      description: "New user has been added successfully.",
    });
  };

  const handleCardClick = (route: string) => {
    // Optional navigation logic
  };

  // Calculate user statistics
  const totalUsers = users.length;
  const activeUsers = users.length;
  const pharmacists = users.filter(user => user.role === "PHARMACIST").length;
  const dispensers = users.filter(user => user.role === "DISPENSER").length;
  const superAdmins = users.filter(user => user.role === "SUPER_ADMIN").length;

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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <EnhancedStatCard
          title="Total Users"
          value={totalUsers.toString()}
          icon={UsersIcon}
          trend=""
          trendUp={true}
          route="/users"
          onClick={handleCardClick}
          colorScheme="primary"
          comparisonLabel="System accounts"
        />
        <EnhancedStatCard
          title="Super Admins"
          value={superAdmins.toString()}
          icon={ShieldCheck}
          trend=""
          trendUp={true}
          route="/users"
          onClick={handleCardClick}
          colorScheme="danger"
          comparisonLabel="Admin access"
        />
        <EnhancedStatCard
          title="Pharmacists"
          value={pharmacists.toString()}
          icon={UserCog}
          trend=""
          trendUp={true}
          route="/users"
          onClick={handleCardClick}
          colorScheme="success"
          comparisonLabel="Staff members"
        />
        <EnhancedStatCard
          title="Dispensers"
          value={dispensers.toString()}
          icon={UserCheck}
          trend=""
          trendUp={true}
          route="/users"
          onClick={handleCardClick}
          colorScheme="primary"
          comparisonLabel="Staff members"
        />
        <EnhancedStatCard
          title="Active Users"
          value={activeUsers.toString()}
          icon={Activity}
          trend=""
          trendUp={true}
          route="/users"
          onClick={handleCardClick}
          colorScheme="success"
          comparisonLabel="Currently active"
        />
      </div>

      <EnhancedCard colorScheme="primary">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg">User List</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "SUPER_ADMIN"
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
                    )
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </EnhancedCard>
    </div>
  );
};

export default Users;
