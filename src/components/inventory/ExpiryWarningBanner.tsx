
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/hooks/useInventory";
import { useNavigate } from "react-router-dom";

interface ExpiryWarningBannerProps {
  expiringItems: InventoryItem[];
}

export const ExpiryWarningBanner = ({ expiringItems }: ExpiryWarningBannerProps) => {
  const navigate = useNavigate();
  const itemCount = expiringItems.length;
  
  // Find the nearest expiry date
  const nearestExpiryDate = expiringItems.reduce((earliest, item) => {
    if (!item.expiryDate) return earliest;
    const expiryDate = new Date(item.expiryDate);
    if (!earliest || expiryDate < earliest) {
      return expiryDate;
    }
    return earliest;
  }, null as Date | null);
  
  // Calculate the number of critical items (expiring within 30 days)
  const criticalItems = expiringItems.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  });
  
  const handleViewAll = () => {
    navigate("/reports", { state: { activeTab: "expiring" } });
  };
  
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle>Expiring Inventory Warning</AlertTitle>
        <AlertDescription>
          {itemCount} {itemCount === 1 ? 'product is' : 'products are'} expiring within the next 90 days.
          {criticalItems.length > 0 && (
            <span className="font-medium text-red-600"> ({criticalItems.length} critical in 30 days)</span>
          )}
          {nearestExpiryDate && (
            <span className="font-medium"> Nearest expiry: {nearestExpiryDate.toLocaleDateString()}</span>
          )}
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleViewAll}
        className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
      >
        View All
      </Button>
    </Alert>
  );
};
