import { TestTube, AlertTriangle, Calendar, LucideIcon } from "lucide-react";
import { EnhancedStatCard } from "@/components/admin/EnhancedStatCard";

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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <EnhancedStatCard
        title="Total Medications"
        value={totalMedications.toString()}
        icon={TestTube}
        trend=""
        trendUp={true}
        route="/inventory"
        onClick={handleClick}
        colorScheme="primary"
        comparisonLabel="Total inventory items"
      />
      <EnhancedStatCard
        title="Low Stock"
        value={lowStockCount.toString()}
        icon={AlertTriangle}
        trend=""
        trendUp={false}
        route="/inventory"
        onClick={handleClick}
        colorScheme="warning"
        comparisonLabel="Need attention soon"
      />
      <EnhancedStatCard
        title="Critical Stock"
        value={criticalStockCount.toString()}
        icon={AlertTriangle}
        trend=""
        trendUp={false}
        route="/inventory"
        onClick={handleClick}
        colorScheme="danger"
        comparisonLabel="Require immediate restock"
      />
      <EnhancedStatCard
        title="Expiring Soon"
        value={expiringSoonCount.toString()}
        icon={Calendar}
        trend=""
        trendUp={false}
        route="/inventory"
        onClick={handleClick}
        colorScheme="success"
        comparisonLabel="Within next 30 days"
      />
    </div>
  );
};
