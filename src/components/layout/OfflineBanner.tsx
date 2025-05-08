
import { useOffline } from "@/contexts/OfflineContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, syncPending, syncData } = useOffline();

  if (isOnline && !syncPending) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md">
      <Alert variant={syncPending ? "default" : "destructive"} className="flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          {syncPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          
          <AlertDescription>
            {syncPending
              ? "Pending changes will sync when you're back online"
              : "You are currently working offline"}
          </AlertDescription>
        </div>
        
        {syncPending && isOnline && (
          <Button size="sm" variant="outline" onClick={syncData}>
            Sync Now
          </Button>
        )}
      </Alert>
    </div>
  );
}
