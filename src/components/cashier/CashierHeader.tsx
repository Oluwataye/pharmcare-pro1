
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";

interface CashierHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleNewSale: () => void;
}

export const CashierHeader = ({ searchQuery, setSearchQuery, handleNewSale }: CashierHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Cashier Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage sales and transactions</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-8 w-full transition-all" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleNewSale} className="bg-primary hover:bg-primary/90 transition-colors w-full sm:w-auto">
          <ShoppingCart className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>
    </div>
  );
};
