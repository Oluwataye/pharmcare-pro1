import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInventory } from '@/hooks/useInventory';

const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const LAST_CHECK_KEY = 'LAST_NOTIFICATION_CHECK';

export function useInventoryAlerts() {
  const { permission, sendBulkLowStockAlert, sendBulkExpiryAlert } = usePushNotifications();
  const { inventory, isLoading } = useInventory();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (permission !== 'granted' || isLoading || hasCheckedRef.current) {
      return;
    }

    // Check if we've already sent notifications recently
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();
    
    if (lastCheck && now - parseInt(lastCheck) < CHECK_INTERVAL) {
      return;
    }

    hasCheckedRef.current = true;

    // Calculate low stock items
    const lowStockItems = inventory.filter(
      item => item.quantity <= item.reorderLevel
    );

    // Calculate expiring items (within 90 days)
    const expiringItems = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const daysUntil = Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
      return daysUntil <= 90 && daysUntil > 0;
    });

    // Calculate critical items (within 30 days)
    const criticalItems = expiringItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const daysUntil = Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30;
    });

    // Send notifications
    if (lowStockItems.length > 0) {
      sendBulkLowStockAlert(lowStockItems.length);
    }

    if (expiringItems.length > 0) {
      sendBulkExpiryAlert(expiringItems.length, criticalItems.length);
    }

    // Update last check time
    localStorage.setItem(LAST_CHECK_KEY, now.toString());
  }, [permission, inventory, isLoading, sendBulkLowStockAlert, sendBulkExpiryAlert]);
}
