import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

const WARNING_BEFORE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes before expiry

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { session, logout, isAuthenticated } = useAuth();
  const hasLoggedOut = useRef(false);

  const handleLogoutOnTimeout = useCallback(() => {
    if (!hasLoggedOut.current) {
      hasLoggedOut.current = true;
      logout();
    }
  }, [logout]);

  useEffect(() => {
    // Reset logout flag when session changes
    if (session) {
      hasLoggedOut.current = false;
    }
  }, [session]);

  useEffect(() => {
    if (!session || !isAuthenticated) return;

    const checkSessionTimeout = () => {
      // Use session expires_at for accurate timeout calculation
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (!expiresAt) return;

      const now = Date.now();
      const remaining = expiresAt - now;

      // Show warning 30 minutes before expiry
      if (remaining <= WARNING_BEFORE_EXPIRY_MS && remaining > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.ceil(remaining / 60000)); // Convert to minutes
      } else {
        setShowWarning(false);
      }

      // Auto logout when session expires
      if (remaining <= 0 && !hasLoggedOut.current) {
        handleLogoutOnTimeout();
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60000);

    return () => clearInterval(interval);
  }, [session, isAuthenticated, handleLogoutOnTimeout]);

  const handleExtendSession = async () => {
    setShowWarning(false);
    // Session will be automatically extended by any activity through Supabase
    window.location.reload();
  };

  const handleLogout = () => {
    setShowWarning(false);
    handleLogoutOnTimeout();
  };

  if (!showWarning) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in approximately {timeRemaining} minutes.
            Would you like to extend your session or log out now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
