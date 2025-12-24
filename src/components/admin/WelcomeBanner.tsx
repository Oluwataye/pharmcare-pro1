import { useState } from "react";
import { X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeBannerProps {
  lowStockCount: number;
  onQuickAction?: () => void;
}

export const WelcomeBanner = ({ lowStockCount, onQuickAction }: WelcomeBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();

  if (isDismissed) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
      <div className="p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}!
            </h2>
            <p className="text-muted-foreground mb-4">
              Here's what's happening today
            </p>
            
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-md border border-warning/20">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">
                    {lowStockCount} items running low - <button className="underline hover:text-warning/80" onClick={onQuickAction}>Review now</button>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};