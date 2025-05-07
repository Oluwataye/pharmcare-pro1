
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/hooks/useInventory";

interface ExpiryWarningBannerProps {
  expiringItems: InventoryItem[];
}

export const ExpiryWarningBanner = ({ expiringItems }: ExpiryWarningBannerProps) => {
  const itemCount = expiringItems.length;
  const nearestExpiryDate = expiringItems.reduce((earliest, item) => {
    if (!item.expiryDate) return earliest;
    const expiryDate = new Date(item.expiryDate);
    if (!earliest || expiryDate < earliest) {
      return expiryDate;
    }
    return earliest;
  }, null as Date | null);
  
  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-300">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <AlertTitle className="text-amber-800">Expiring Inventory Warning</AlertTitle>
        <AlertDescription className="text-amber-700">
          {itemCount} {itemCount === 1 ? 'product is' : 'products are'} expiring within the next 90 days.
          {nearestExpiryDate && (
            <span className="font-medium"> Nearest expiry: {nearestExpiryDate.toLocaleDateString()}</span>
          )}
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
      >
        View All
      </Button>
    </Alert>
  );
};
