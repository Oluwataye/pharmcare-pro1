import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AddUserDialog } from "./AddUserDialog";

interface UserToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const UserToolbar = ({ searchTerm, onSearchChange }: UserToolbarProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <AddUserDialog />
      </div>
    </div>
  );
};