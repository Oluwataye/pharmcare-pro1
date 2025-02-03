import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SalesToolbar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <h1 className="text-2xl font-bold">Sales Management</h1>
      <div className="flex gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sales..." className="pl-8" />
        </div>
        <Button onClick={() => navigate("/sales/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>
    </div>
  );
};

export default SalesToolbar;