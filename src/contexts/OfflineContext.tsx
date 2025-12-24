import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextType {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  syncPending: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncData: () => Promise<void>;
  addPendingOperation: (operation: PendingOperation) => void;
  clearPendingOperations: () => void;
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data?: unknown;
  timestamp: number;
}

const defaultOfflineContext: OfflineContextType = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastOnlineTime: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
  syncPending: false,
  pendingCount: 0,
  isSyncing: false,
  syncData: async () => {},
  addPendingOperation: () => {},
  clearPendingOperations: () => {},
};

const OfflineContext = createContext<OfflineContextType>(defaultOfflineContext);

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider = ({ children }: OfflineProviderProps) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null
  );
  const [syncPending, setSyncPending] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load pending operations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('PENDING_OPERATIONS');
    if (stored) {
      try {
        const operations = JSON.parse(stored) as PendingOperation[];
        setPendingOperations(operations);
        if (operations.length > 0) {
          setSyncPending(true);
        }
      } catch (e) {
        console.error('Failed to parse pending operations:', e);
      }
    }

    const storedLastOnlineTime = localStorage.getItem('LAST_ONLINE_TIME');
    if (storedLastOnlineTime) {
      setLastOnlineTime(new Date(storedLastOnlineTime));
    }
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem('PENDING_OPERATIONS', JSON.stringify(pendingOperations));
    localStorage.setItem('SYNC_PENDING', pendingOperations.length > 0 ? 'true' : 'false');
    setSyncPending(pendingOperations.length > 0);
  }, [pendingOperations]);

  const addPendingOperation = useCallback((operation: PendingOperation) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const now = new Date();
      setLastOnlineTime(now);
      localStorage.setItem('LAST_ONLINE_TIME', now.toISOString());
      
      if (pendingOperations.length > 0) {
        toast({
          title: "Connection Restored",
          description: `Your device is back online. ${pendingOperations.length} change(s) ready to sync.`,
        });
      } else {
        toast({
          title: "Connection Restored",
          description: "Your device is back online.",
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You are now working offline. Changes will sync when connection returns.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, pendingOperations.length]);

  const syncData = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "You are currently offline. Data will sync automatically when you're back online.",
      });
      return;
    }

    if (pendingOperations.length === 0) {
      toast({
        title: "Already Synced",
        description: "All changes are up to date.",
      });
      return;
    }

    try {
      setIsSyncing(true);
      toast({
        title: "Syncing Data",
        description: `Synchronizing ${pendingOperations.length} offline change(s)...`,
      });
      
      // Process each pending operation
      // In a real app, this would make API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      clearPendingOperations();
      
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
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingOperations, clearPendingOperations, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && !isSyncing) {
      const timer = setTimeout(() => syncData(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOperations.length, isSyncing, syncData]);

  return (
    <OfflineContext.Provider 
      value={{ 
        isOnline, 
        lastOnlineTime, 
        syncPending, 
        pendingCount: pendingOperations.length,
        isSyncing,
        syncData,
        addPendingOperation,
        clearPendingOperations,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
