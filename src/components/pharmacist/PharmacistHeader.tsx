
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PharmacistHeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAddMedication: () => void;
}

export const PharmacistHeader = ({
  searchQuery,
  setSearchQuery,
  onAddMedication,
}: PharmacistHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Pharmacist Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage medications and inventory</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search medications..." 
            className="pl-8 w-full md:w-[300px] transition-all" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          onClick={onAddMedication} 
          className="bg-primary hover:bg-primary/90 transition-colors w-full md:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {isMobile ? "Add" : "Add Medication"}
        </Button>
      </div>
    </div>
  );
};
