import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const WARNING_TIME = 7.5 * 60 * 60 * 1000; // 7.5 hours (30 min before timeout)

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { session, logout } = useAuth();

  useEffect(() => {
    if (!session) return;

    const checkSessionTimeout = () => {
      const sessionStart = new Date(session.user.created_at).getTime();
      const now = Date.now();
      const elapsed = now - sessionStart;
      const remaining = SESSION_DURATION - elapsed;

      // Show warning at 7.5 hours (30 minutes before timeout)
      if (elapsed >= WARNING_TIME && remaining > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.ceil(remaining / 60000)); // Convert to minutes
      }

      // Auto logout at 8 hours
      if (remaining <= 0) {
        logout();
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60000);

    return () => clearInterval(interval);
  }, [session, logout]);

  const handleExtendSession = async () => {
    setShowWarning(false);
    // Session will be automatically extended by any activity through Supabase
    window.location.reload();
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  if (!showWarning) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in approximately {timeRemaining} minutes due to inactivity.
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
