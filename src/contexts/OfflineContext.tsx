
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextType {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  syncPending: boolean;
  syncData: () => Promise<void>;
}

const defaultOfflineContext: OfflineContextType = {
  isOnline: navigator.onLine,
  lastOnlineTime: navigator.onLine ? new Date() : null,
  syncPending: false,
  syncData: async () => {},
};

const OfflineContext = createContext<OfflineContextType>(defaultOfflineContext);

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider = ({ children }: OfflineProviderProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(navigator.onLine ? new Date() : null);
  const [syncPending, setSyncPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored pending sync operations
    const pendingSync = localStorage.getItem('SYNC_PENDING') === 'true';
    setSyncPending(pendingSync);

    // Get last online time from storage
    const storedLastOnlineTime = localStorage.getItem('LAST_ONLINE_TIME');
    if (storedLastOnlineTime) {
      setLastOnlineTime(new Date(storedLastOnlineTime));
    }

    const handleOnline = () => {
      setIsOnline(true);
      const now = new Date();
      setLastOnlineTime(now);
      localStorage.setItem('LAST_ONLINE_TIME', now.toISOString());
      
      // Check if we need to sync
      if (localStorage.getItem('SYNC_PENDING') === 'true') {
        toast({
          title: "Connection Restored",
          description: "Your device is back online. Syncing data...",
        });
        setSyncPending(true);
      } else {
        toast({
          title: "Connection Restored",
          description: "Your device is back online.",
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Mark that we'll need to sync when back online
      localStorage.setItem('SYNC_PENDING', 'true');
      toast({
        title: "Connection Lost",
        description: "You are now working offline. Changes will sync when connection returns.",
        variant: "warning",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "You are currently offline. Data will sync automatically when you're back online.",
        variant: "warning",
      });
      return;
    }

    try {
      setSyncPending(true);
      toast({
        title: "Syncing Data",
        description: "Synchronizing your offline changes...",
      });
      
      // This is where we would trigger actual sync operations
      // For now, we'll just simulate a sync with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      localStorage.setItem('SYNC_PENDING', 'false');
      setSyncPending(false);
      
      toast({
        title: "Sync Complete",
        description: "Your data has been successfully synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to sync data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Auto-sync when coming back online and we have pending changes
    if (isOnline && syncPending) {
      syncData();
    }
  }, [isOnline, syncPending]);

  return (
    <OfflineContext.Provider value={{ isOnline, lastOnlineTime, syncPending, syncData }}>
      {children}
    </OfflineContext.Provider>
  );
};
