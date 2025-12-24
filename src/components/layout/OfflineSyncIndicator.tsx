import { useOffline } from "@/contexts/OfflineContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Cloud, 
  CloudOff,
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineSyncIndicator() {
  const { isOnline, syncPending, pendingCount, syncData, isSyncing } = useOffline();

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (syncPending || pendingCount > 0) {
      return <CloudOff className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isSyncing) return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (!isOnline) return "bg-destructive/10 text-destructive border-destructive/20";
    if (syncPending || pendingCount > 0) return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    return "bg-green-500/10 text-green-600 border-green-200";
  };

  const getStatusText = () => {
    if (isSyncing) return "Syncing...";
    if (!isOnline) return "Offline";
    if (syncPending || pendingCount > 0) return `${pendingCount} pending`;
    return "Synced";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-2 px-3 border rounded-full transition-all",
            getStatusColor()
          )}
        >
          {getStatusIcon()}
          <span className="text-xs font-medium hidden sm:inline">
            {getStatusText()}
          </span>
          {pendingCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-5 px-1.5 text-xs bg-yellow-500 text-white"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isOnline ? "bg-green-500/10" : "bg-destructive/10"
            )}>
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                {isOnline ? "Connected" : "Offline Mode"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline 
                  ? "All changes sync in real-time" 
                  : "Changes saved locally"}
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700">
                  {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-yellow-600">
                  Will sync when online
                </p>
              </div>
            </div>
          )}

          {isOnline && (syncPending || pendingCount > 0) && (
            <Button 
              onClick={syncData} 
              disabled={isSyncing}
              className="w-full"
              size="sm"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          )}

          {isOnline && !syncPending && pendingCount === 0 && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="h-4 w-4" />
              <span>All changes synced</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
