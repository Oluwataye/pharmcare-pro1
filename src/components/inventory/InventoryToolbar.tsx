
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus, Printer, Filter, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface InventoryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter?: string;
  categories?: string[];
  onCategoryChange?: (category: string) => void;
  onRefresh: () => void;
  onAddItem: () => void;
  onPrint: () => void;
  onBulkUpload?: () => void;
}

export const InventoryToolbar = ({
  searchTerm,
  onSearchChange,
  categoryFilter = "",
  categories = [],
  onCategoryChange,
  onRefresh,
  onAddItem,
  onPrint,
  onBulkUpload,
}: InventoryToolbarProps) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        
        {categories.length > 0 && (
          <div className="w-[180px]">
            <Select
              value={categoryFilter}
              onValueChange={onCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onPrint}
          className="shrink-0"
        >
          <Printer className="h-4 w-4" />
        </Button>
        {isSuperAdmin && onBulkUpload && (
          <Button onClick={onBulkUpload} variant="outline" className="shrink-0">
            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
          </Button>
        )}
        <Button onClick={onAddItem} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
    </div>
  );
};
