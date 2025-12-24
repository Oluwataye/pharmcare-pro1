import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LowStockItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  reorderLevel: number;
}

interface EnhancedLowStockCardProps {
  items: LowStockItem[];
  onItemClick: (route: string, id: number) => void;
  onViewAllClick: (route: string) => void;
}

export const EnhancedLowStockCard = ({
  items,
  onItemClick,
  onViewAllClick,
}: EnhancedLowStockCardProps) => {
  const getUrgencyLevel = (quantity: number, reorderLevel: number) => {
    const percentage = (quantity / reorderLevel) * 100;
    if (percentage <= 30) return 'critical';
    if (percentage <= 60) return 'warning';
    return 'caution';
  };

  const urgencyColors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    caution: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg border-l-4 border-l-amber-500">
      <CardHeader className="p-4 md:p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Low Stock Alerts
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {items.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-3">
          {items.length > 0 ? (
            <>
              {items.map((item) => {
                const urgency = getUrgencyLevel(item.quantity, item.reorderLevel);
                return (
                  <div
                    key={item.id}
                    className="group p-3 hover:bg-accent rounded-lg cursor-pointer transition-all border"
                    onClick={() => onItemClick('/inventory', item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {item.product}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={cn(
                            "text-xs font-bold border",
                            urgencyColors[urgency]
                          )}
                          variant="outline"
                        >
                          {item.quantity} left
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reorder: {item.reorderLevel}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            urgency === 'critical' && "bg-red-500",
                            urgency === 'warning' && "bg-amber-500",
                            urgency === 'caution' && "bg-yellow-500"
                          )}
                          style={{ width: `${Math.min((item.quantity / item.reorderLevel) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                className="w-full justify-between hover:bg-primary/5 text-primary font-medium"
                onClick={() => onViewAllClick('/inventory')}
              >
                View all low stock items
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              All items are well stocked
            </p>
          )}
        </div>
      </CardContent>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
    </Card>
  );
};