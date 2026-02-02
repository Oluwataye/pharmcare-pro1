import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OfflineContextType {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  syncPending: boolean;
  pendingCount: number;
  pendingOperations: PendingOperation[];
  isSyncing: boolean;
  syncData: () => Promise<void>;
  addPendingOperation: (operation: PendingOperation) => void;
  clearPendingOperations: () => void;
  conflicts: SyncConflict[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'server' | 'merge', mergedData?: any) => Promise<void>;
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data?: any;
  timestamp: number;
  snapshot?: any; // The record state at the time of modification
}

export interface SyncConflict {
  id: string;
  operation: PendingOperation;
  serverVersion: any;
  timestamp: number;
}

const defaultOfflineContext: OfflineContextType = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastOnlineTime: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
  syncPending: false,
  pendingCount: 0,
  isSyncing: false,
  syncData: async () => { },
  addPendingOperation: () => { },
  clearPendingOperations: () => { },
  pendingOperations: [],
  conflicts: [],
  resolveConflict: async () => { },
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
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
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
        title: "Sync Delayed",
        description: "You are currently offline. Data will sync automatically when you're back online.",
      });
      return;
    }

    if (pendingOperations.length === 0) return;

    try {
      setIsSyncing(true);

      const operationsToProcess = [...pendingOperations];
      const successfulIds: string[] = [];
      const failedIds: string[] = [];

      for (const op of operationsToProcess) {
        try {
          console.log(`[OfflineSync] Processing ${op.resource} ${op.type} (ID: ${op.id})`);

          // CONFLICT DETECTION
          if (op.type === 'update' && op.resource !== 'sales' && op.id) {
            const { data: serverRecord, error: fetchError } = await supabase
              .from(op.resource as any)
              .select('*')
              .eq('id', op.id)
              .single();

            if (!fetchError && serverRecord) {
              // Compare server's updated_at with local snapshot's updated_at if available
              const serverUpdatedAt = (serverRecord as any).updated_at ? new Date((serverRecord as any).updated_at).getTime() : 0;
              const localUpdatedAt = op.snapshot?.updated_at ? new Date(op.snapshot.updated_at).getTime() : 0;

              if (serverUpdatedAt > localUpdatedAt) {
                console.warn(`[OfflineSync] Conflict detected for ${op.resource} ${op.id}`);
                setConflicts(prev => [...prev, {
                  id: op.id,
                  operation: op,
                  serverVersion: serverRecord,
                  timestamp: Date.now()
                }]);
                failedIds.push(op.id);
                continue; // Skip this operation, it needs manual resolution
              }
            }
          }

          // RETRY LOGIC (3 attempts)
          let attempts = 0;
          let success = false;
          let lastError = null;

          while (attempts < 3 && !success) {
            try {
              if (attempts > 0) await new Promise(r => setTimeout(r, 1000 * attempts)); // Backoff

              if (op.resource === 'sales' && op.type === 'create') {
                const { error } = await supabase.functions.invoke('complete-sale', { body: op.data });
                if (error) throw error;
              } else if (op.resource === 'inventory') {
                const inventoryData = op.data as any;
                if (op.type === 'create') {
                  const { id, ...dataToInsert } = inventoryData;
                  const { error } = await supabase.from('inventory').insert(dataToInsert);
                  if (error) throw error;
                } else if (op.type === 'update' && op.id) {
                  const { error } = await supabase.from('inventory').update(inventoryData).eq('id', op.id);
                  if (error) throw error;
                } else if (op.type === 'delete' && op.id) {
                  const { error } = await supabase.from('inventory').delete().eq('id', op.id);
                  if (error) throw error;
                }
              } else {
                if (op.type === 'create') {
                  const { error } = await supabase.from(op.resource as any).insert(op.data);
                  if (error) throw error;
                } else if (op.type === 'update' && op.id) {
                  const { error } = await supabase.from(op.resource as any).update(op.data).eq('id', op.id);
                  if (error) throw error;
                } else if (op.type === 'delete' && op.id) {
                  const { error } = await supabase.from(op.resource as any).delete().eq('id', op.id);
                  if (error) throw error;
                }
              }
              success = true;
            } catch (err) {
              lastError = err;
              attempts++;
              console.warn(`[OfflineSync] Attempt ${attempts} failed for ${op.resource} ${op.id}`, err);
            }
          }

          if (success) {
            successfulIds.push(op.id);
          } else {
            throw lastError || new Error('Max retries exceeded');
          }
        } catch (opError) {
          console.error(`[OfflineSync] Failed to process ${op.resource} ${op.id} after retries:`, opError);
          failedIds.push(op.id);
        }
      }

      // Update the queue: keep only those that failed or were added during this process
      setPendingOperations(prev => prev.filter(op => !successfulIds.includes(op.id)));

      if (failedIds.length === 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synchronized ${successfulIds.length} change(s).`,
        });
      } else {
        toast({
          title: "Sync Partially Complete",
          description: `Synced ${successfulIds.length} items, but ${failedIds.length} failed. Will retry later.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[OfflineSync] Critical sync failure:', error);
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred during synchronization.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingOperations, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && !isSyncing) {
      const timer = setTimeout(() => syncData(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOperations.length, isSyncing, syncData]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      setIsSyncing(true);
      const { operation, serverVersion } = conflict;

      if (resolution === 'server') {
        // Discard local changes: remove from pendingOperations and conflicts
        setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        toast({ title: "Conflict Resolved", description: "Server version kept." });
      } else {
        // Resolve with local or merge: perform update on server
        const finalData = resolution === 'local' ? operation.data : mergedData;

        const { error } = await supabase
          .from(operation.resource as any)
          .update(finalData)
          .eq('id', operation.id);

        if (error) throw error;

        // Clear from both queues on success
        setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
        setConflicts(prev => prev.filter(c => c.id !== conflictId));

        toast({
          title: "Conflict Resolved",
          description: resolution === 'local' ? "Local version applied." : "Merged version applied."
        });
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to resolve conflict:', error);
      toast({
        title: "Resolution Failed",
        description: "Could not apply resolution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [conflicts, toast]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        lastOnlineTime,
        syncPending,
        pendingCount: pendingOperations.length,
        pendingOperations,
        isSyncing,
        syncData,
        addPendingOperation,
        clearPendingOperations,
        conflicts,
        resolveConflict
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};
