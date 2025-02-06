import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserStats } from "@/components/users/UserStats";
import { UserToolbar } from "@/components/users/UserToolbar";
import { UserTable } from "@/components/users/UserTable";

const Users = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Active",
      lastLogin: "2024-02-20",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Pharmacist",
      status: "Active",
      lastLogin: "2024-02-19",
    },
    {
      id: 3,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Cashier",
      status: "Active",
      lastLogin: "2024-02-18",
    },
    {
      id: 4,
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "Pharmacist",
      status: "Inactive",
      lastLogin: "2024-02-17",
    },
  ];

  const handleEditUser = (userId: number) => {
    toast({
      title: "Edit User",
      description: `Editing user with ID: ${userId}`,
    });
  };

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "Delete User",
      description: `Deleting user with ID: ${userId}`,
      variant: "destructive",
    });
  };

  const handleToggleStatus = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    toast({
      title: "Status Updated",
      description: `User status changed to ${newStatus}`,
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <UserToolbar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <UserStats users={users} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User List</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable 
            users={filteredUsers}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;