
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const WARNING_MS = 14 * 60 * 1000; // 14 Minutes
// const TIMEOUT_MS = 10000; // Testing: 10s
// const WARNING_MS = 5000; // Testing: 5s

export const SessionTimeout = () => {
    const { lockSession, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [showWarning, setShowWarning] = useState(false);
    const idleTimer = useRef<NodeJS.Timeout | null>(null);
    const warningTimer = useRef<NodeJS.Timeout | null>(null);

    const resetTimers = () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        if (warningTimer.current) clearTimeout(warningTimer.current);

        if (!isAuthenticated) return;

        // Start Warning Timer
        warningTimer.current = setTimeout(() => {
            setShowWarning(true);
        }, WARNING_MS);

        // Start Logout/Lock Timer
        idleTimer.current = setTimeout(() => {
            handleTimeout();
        }, TIMEOUT_MS);
    };

    const handleTimeout = () => {
        setShowWarning(false);
        lockSession();
    };

    const handleActivity = () => {
        if (showWarning) {
            setShowWarning(false);
            toast({
                title: "Session Resumed",
                description: "Your session is active.",
            });
        }
        resetTimers();
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        // Events to listen for
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Throttle the activity handler
        let isThrottled = false;
        const throttledHandler = () => {
            if (!isThrottled) {
                handleActivity();
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 1000);
            }
        };

        events.forEach(event => {
            window.addEventListener(event, throttledHandler);
        });

        resetTimers();

        return () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (warningTimer.current) clearTimeout(warningTimer.current);
            events.forEach(event => {
                window.removeEventListener(event, throttledHandler);
            });
        };
    }, [isAuthenticated]);

    return (
        <AlertDialog open={showWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have been inactive for a while. Your session will be locked in 1 minute to protect your data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleActivity}>
                        I'm still here
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
