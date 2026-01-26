import { useQueryClient } from '@tanstack/react-query';
import { useOffline, PendingOperation } from '@/contexts/OfflineContext';
import { useToast } from '@/hooks/use-toast';

export function useOfflineData() {
  const queryClient = useQueryClient();
  const { isOnline, addPendingOperation, clearPendingOperations, pendingCount } = useOffline();
  const { toast } = useToast();

  // Update the React Query cache based on the operation
  const updateLocalCache = (operation: PendingOperation) => {
    switch (operation.type) {
      case 'create': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return [...old, operation.data];
        });
        break;
      }
      case 'update': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return old.map((item: any) =>
            item.id === operation.id ? { ...item, ...(operation.data as any) } : item
          );
        });
        break;
      }
      case 'delete': {
        queryClient.setQueryData([operation.resource], (old: any[] = []) => {
          return old.filter((item: any) => item.id !== operation.id);
        });
        break;
      }
    }
  };

  const queueOperation = (type: 'create' | 'update' | 'delete', resource: string, id?: string, data?: any) => {
    const operation: PendingOperation = {
      id: id || `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      resource,
      data,
      timestamp: Date.now(),
    };

    addPendingOperation(operation);
    updateLocalCache(operation);
    return operation;
  };

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

    return queueOperation('create', resource, tempId, itemWithId);
  };

  const updateOfflineItem = <T>(resource: string, id: string, data: Partial<T>) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: `Your changes to this ${resource} have been saved offline and will sync when you're back online.`,
      });
    }

    return queueOperation('update', resource, id, data);
  };

  const deleteOfflineItem = (resource: string, id: string) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: `This ${resource} has been marked for deletion and will be removed when you're back online.`,
      });
    }

    return queueOperation('delete', resource, id);
  };

  return {
    pendingOperations: [], // Maintain interface compatibility if needed, but useOffline().pendingCount is better
    pendingCount,
    createOfflineItem,
    updateOfflineItem,
    deleteOfflineItem,
    clearPendingOperations,
  };
}
