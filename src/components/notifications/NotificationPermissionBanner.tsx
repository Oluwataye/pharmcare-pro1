import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

export function NotificationPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Show banner if notifications are supported but not yet granted/denied
    const dismissed = localStorage.getItem('NOTIFICATION_BANNER_DISMISSED');
    const shouldShow = isSupported && permission === 'default' && !dismissed;
    
    // Delay showing to avoid overwhelming user on first load
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('NOTIFICATION_BANNER_DISMISSED', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg animate-in slide-in-from-top-4 duration-300">
      <Alert className="border-primary/20 bg-primary/5 shadow-lg">
        <Bell className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span className="text-sm">
            Enable notifications for low stock alerts and expiry reminders
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleEnable}>
              Enable
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
