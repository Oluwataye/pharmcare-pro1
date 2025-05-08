
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOffline } from '@/contexts/OfflineContext';
import { useToast } from '@/hooks/use-toast';

interface OfflineOperation<T = any> {
  type: 'create' | 'update' | 'delete';
  resource: string;
  id?: string;
  data?: T;
  timestamp: number;
  synced: boolean;
}

export function useOfflineData() {
  const queryClient = useQueryClient();
  const { isOnline } = useOffline();
  const { toast } = useToast();
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>(() => {
    const stored = localStorage.getItem('PENDING_OPERATIONS');
    return stored ? JSON.parse(stored) : [];
  });

  // Save an operation for later sync
  const queueOperation = <T>(operation: Omit<OfflineOperation<T>, 'timestamp' | 'synced'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      timestamp: Date.now(),
      synced: false
    };

    const updatedOperations = [...pendingOperations, newOperation];
    setPendingOperations(updatedOperations);
    localStorage.setItem('PENDING_OPERATIONS', JSON.stringify(updatedOperations));
    localStorage.setItem('SYNC_PENDING', 'true');
    
    // Update the local cache immediately
    updateLocalCache(newOperation);
    
    return newOperation;
  };
  
  // Update the React Query cache based on the operation
  const updateLocalCache = (operation: OfflineOperation) => {
    switch (operation.type) {
      case 'create': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return [...old, operation.data];
        });
        break;
      }
      case 'update': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return old.map(item => 
            item.id === operation.id ? { ...item, ...operation.data } : item
          );
        });
        break;
      }
      case 'delete': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return old.filter(item => item.id !== operation.id);
        });
        break;
      }
    }
  };

  // Handle offline create operation
  const createOfflineItem = <T>(resource: string, data: T) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: `Your ${resource} has been saved offline and will sync when you're back online.`,
      });
    }
    
    // Generate a temporary ID for the item
    const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const itemWithId = { ...data, id: tempId };
    
    return queueOperation({
      type: 'create',
      resource,
      data: itemWithId,
    });
  };

  // Handle offline update operation
  const updateOfflineItem = <T>(resource: string, id: string, data: Partial<T>) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: `Your changes to this ${resource} have been saved offline and will sync when you're back online.`,
      });
    }
    
    return queueOperation({
      type: 'update',
      resource,
      id,
      data,
    });
  };

  // Handle offline delete operation
  const deleteOfflineItem = (resource: string, id: string) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: `This ${resource} has been marked for deletion and will be removed when you're back online.`,
      });
    }
    
    return queueOperation({
      type: 'delete',
      resource,
      id,
    });
  };

  // Clear all pending operations after they've been processed
  const clearPendingOperations = () => {
    setPendingOperations([]);
    localStorage.removeItem('PENDING_OPERATIONS');
    localStorage.setItem('SYNC_PENDING', 'false');
  };

  return {
    pendingOperations,
    createOfflineItem,
    updateOfflineItem,
    deleteOfflineItem,
    clearPendingOperations,
  };
}
