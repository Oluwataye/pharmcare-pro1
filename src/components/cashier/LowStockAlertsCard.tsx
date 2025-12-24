
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
}

interface LowStockAlertsCardProps {
  lowStockItems: LowStockItem[];
  handleItemClick: (route: string, id: number) => void;
  handleCardClick: (route: string) => void;
}

export const LowStockAlertsCard = ({ 
  lowStockItems, 
  handleItemClick, 
  handleCardClick 
}: LowStockAlertsCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => handleItemClick('/inventory', item.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{item.product}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-500">{item.quantity} left</p>
                    <p className="text-xs text-muted-foreground">Reorder: {item.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No low stock alerts
            </p>
          )}
          <div 
            className="text-sm text-primary font-medium cursor-pointer hover:underline"
            onClick={() => handleCardClick('/inventory')}
          >
            View all low stock items
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
