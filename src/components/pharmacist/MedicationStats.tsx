
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { TestTube, AlertTriangle, Calendar } from "lucide-react";

interface MedicationStatsProps {
  totalMedications: number;
  lowStockCount: number;
  criticalStockCount: number;
  expiringSoonCount: number;
  onCardClick?: (route: string) => void;
}

export const MedicationStats = ({
  totalMedications,
  lowStockCount,
  criticalStockCount,
  expiringSoonCount,
  onCardClick,
}: MedicationStatsProps) => {
  const handleClick = (route: string) => {
    if (onCardClick) {
      onCardClick(route);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
        onClick={() => handleClick('/inventory')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
          <TestTube className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMedications}</div>
          <p className="text-xs text-muted-foreground">
            Total inventory items
          </p>
        </CardContent>
      </Card>
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
        onClick={() => handleClick('/inventory')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground">
            Need attention soon
          </p>
        </CardContent>
      </Card>
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
        onClick={() => handleClick('/inventory')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{criticalStockCount}</div>
          <p className="text-xs text-muted-foreground">
            Require immediate restock
          </p>
        </CardContent>
      </Card>
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer"
        onClick={() => handleClick('/inventory')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringSoonCount}</div>
          <p className="text-xs text-muted-foreground">
            Within next 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
