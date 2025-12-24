import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive alerts for low stock and expiring drugs.",
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const sendNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: true,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to regular Notification API
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/pwa-icon-192.png',
          tag: options.tag,
        });
        return true;
      } catch (fallbackError) {
        console.error('Fallback notification failed:', fallbackError);
        return false;
      }
    }
  }, [isSupported, permission]);

  const sendLowStockAlert = useCallback((productName: string, currentStock: number, reorderLevel: number) => {
    return sendNotification({
      title: '⚠️ Low Stock Alert',
      body: `${productName} is running low (${currentStock}/${reorderLevel} units remaining)`,
      tag: `low-stock-${productName}`,
      data: { type: 'low-stock', productName, currentStock, reorderLevel },
    });
  }, [sendNotification]);

  const sendExpiryReminder = useCallback((productName: string, expiryDate: string, daysUntilExpiry: number) => {
    const urgency = daysUntilExpiry <= 7 ? '🔴' : daysUntilExpiry <= 30 ? '🟠' : '🟡';
    return sendNotification({
      title: `${urgency} Expiry Reminder`,
      body: `${productName} expires on ${expiryDate} (${daysUntilExpiry} days remaining)`,
      tag: `expiry-${productName}`,
      data: { type: 'expiry', productName, expiryDate, daysUntilExpiry },
    });
  }, [sendNotification]);

  const sendBulkLowStockAlert = useCallback((count: number) => {
    return sendNotification({
      title: '📦 Multiple Low Stock Items',
      body: `${count} items are below reorder level and need restocking`,
      tag: 'bulk-low-stock',
      data: { type: 'bulk-low-stock', count },
    });
  }, [sendNotification]);

  const sendBulkExpiryAlert = useCallback((count: number, criticalCount: number) => {
    return sendNotification({
      title: '⏰ Expiring Items Alert',
      body: `${count} items expiring soon${criticalCount > 0 ? ` (${criticalCount} critical)` : ''}`,
      tag: 'bulk-expiry',
      data: { type: 'bulk-expiry', count, criticalCount },
    });
  }, [sendNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendLowStockAlert,
    sendExpiryReminder,
    sendBulkLowStockAlert,
    sendBulkExpiryAlert,
  };
}
