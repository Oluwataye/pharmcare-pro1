
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LowStockItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
}

interface LowStockAlertsCardProps {
  items: LowStockItem[];
  onItemClick: (route: string, id: number) => void;
  onViewAllClick: (route: string) => void;
}

export const LowStockAlertsCard = ({
  items,
  onItemClick,
  onViewAllClick,
}: LowStockAlertsCardProps) => {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg font-semibold">Low Stock Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => onItemClick('/inventory', item.id)}
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
            onClick={() => onViewAllClick('/inventory')}
          >
            View all low stock items
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </Card>
  );
};

