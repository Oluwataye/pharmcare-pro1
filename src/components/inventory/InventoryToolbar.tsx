import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus } from "lucide-react";

interface InventoryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddItem: () => void;
}

export const InventoryToolbar = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  onAddItem,
}: InventoryToolbarProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Button onClick={onAddItem} className="shrink-0">
        <Plus className="mr-2 h-4 w-4" /> Add Product
      </Button>
    </div>
  );
};