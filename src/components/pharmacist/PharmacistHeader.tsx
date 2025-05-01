
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle } from "lucide-react";

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
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Pharmacist Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage medications and inventory</p>
      </div>
      <div className="flex gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search medications..." 
            className="pl-8 w-[200px] md:w-[300px] transition-all" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={onAddMedication} className="bg-primary hover:bg-primary/90 transition-colors">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>
    </div>
  );
};
