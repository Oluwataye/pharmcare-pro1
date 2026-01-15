import * as React from 'react';
import { AuthState, User as AppUser, UserRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/rateLimiting';
import { logSuccessfulLogin, logFailedLogin, logLogout } from '@/lib/auditLog';
import { secureStorage } from '@/lib/secureStorage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  session: Session | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AuthProvider] Pulse: Mounting...");
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [session, setSession] = React.useState<Session | null>(null);
  const { toast } = useToast();

  // Fetch user profile and role from database
  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    console.log(`[AuthProvider] Pulse: Fetching profile for user ${userId}...`);
    try {
      // Use specific columns and limit to stabilize the 406-prone single fetch
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('name, username')
        .eq('user_id', userId)
        .limit(1);

      if (profileError) throw profileError;

      const profile = (profiles as any[])?.[0];
      if (!profile) {
        console.warn('No profile found for user:', userId);
        return null;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1);

      if (rolesError) throw rolesError;

      const roleData = (roles as any[])?.[0];
      if (!roleData) {
        console.warn('No role found for user:', userId);
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();

      return {
        id: userId,
        email: user?.email || '',
        name: profile.name,
        username: profile.username || undefined,
        role: roleData.role as UserRole,
      };
    } catch (error) {
      // Expand error object logging for better diagnostics
      console.error('Error fetching user profile details:', JSON.stringify(error, null, 2));
      return null;
    }
  };

  // Initialize auth state and session security
  React.useEffect(() => {
    console.log("[AuthProvider] Pulse: Initializing listener...");

    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          console.log("[AuthProvider] Pulse: Initial session detected, fetching profile...");
          const userProfile = await fetchUserProfile(session.user.id);
          console.log("[AuthProvider] Pulse: Profile fetch complete. User:", !!userProfile);
          setAuthState({
            user: userProfile,
            isAuthenticated: !!userProfile,
            isLoading: false,
          });
        } else {
          console.log("[AuthProvider] Pulse: No session found, setting unauthenticated state");
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("[AuthProvider] Auth initialization error:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthProvider] Pulse: Auth state change event: ${event}`);
        setSession(session);

        if (session?.user) {
          // Only fetch if session is new or user ID differs
          // This avoids flickering during token refreshes
          const userProfile = await fetchUserProfile(session.user.id);
          console.log(`[AuthProvider] Pulse: Profile fetch complete for event ${event}. User:`, !!userProfile);
          setAuthState({
            user: userProfile,
            isAuthenticated: !!userProfile,
            isLoading: false,
          });
        } else if (event === 'SIGNED_OUT') {
          console.log("[AuthProvider] Pulse: User signed out");
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // Automatic logout on window close/tab close (for shared workstations)
    const handleBeforeUnload = () => {
      // Clear session storage on window close
      sessionStorage.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic session validity check (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        setSession(null);
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check rate limit before attempting login
      const rateLimit = await checkLoginRateLimit(email);

      if (!rateLimit.allowed) {
        const resetTime = rateLimit.resetTime
          ? new Date(rateLimit.resetTime).toLocaleTimeString()
          : 'soon';
        throw new Error(`Too many login attempts. Please try again at ${resetTime}`);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Clear rate limit on successful login
        clearLoginRateLimit(email);

        const userProfile = await fetchUserProfile(data.user.id);

        if (!userProfile) {
          throw new Error('Unable to load user profile');
        }

        // Log successful login
        logSuccessfulLogin(data.user.id, email, userProfile.role);

        setAuthState({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({
          title: 'Login successful',
          description: `Welcome back, ${userProfile.name}!`,
        });
      }
    } catch (error: any) {
      // Log failed login attempt
      logFailedLogin(email, error.message || 'Unknown error');

      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    const currentUser = authState.user;
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Log logout event before clearing session
      if (currentUser) {
        logLogout(currentUser.id, currentUser.email);
      }

      // Clear all sensitive session data
      secureStorage.clear();
      sessionStorage.clear();

      await supabase.auth.signOut();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const authValue = React.useMemo(() => ({
    ...authState,
    login,
    logout,
    session,
  }), [authState, session]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
