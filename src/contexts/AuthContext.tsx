import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/';
    case 'PHARMACIST':
      return '/inventory';
    case 'CASHIER':
      return '/sales';
    default:
      return '/';
  }
};

const PUBLIC_ROUTES = ['/login', '/unauthorized'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const { toast } = useToast();
  const { logUserActivity } = useActivityLogger();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
          role: (session.user.user_metadata.role as UserRole) || 'CASHIER',
        };
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Only redirect if on a public route
        if (PUBLIC_ROUTES.includes(location.pathname)) {
          const redirectPath = getRedirectPath(user.role);
          navigate(redirectPath);
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Redirect to login if not on a public route
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate('/login');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'User',
          role: (session.user.user_metadata.role as UserRole) || 'CASHIER',
        };
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        if (event === 'SIGNED_IN') {
          const redirectPath = getRedirectPath(user.role);
          navigate(redirectPath);
          toast({
            title: "Welcome back!",
            description: `Logged in as ${user.role.toLowerCase()}`,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });

        if (event === 'SIGNED_OUT') {
          navigate('/login');
          toast({
            title: "Logged out",
            description: "Successfully signed out",
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || 'User',
        role: (data.user.user_metadata.role as UserRole) || 'CASHIER',
      };

      logUserActivity('LOGIN', user);
      
      // Redirect handled by onAuthStateChange
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      logUserActivity('LOGOUT', authState.user);
      await supabase.auth.signOut();
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    return authState.user ? allowedRoles.includes(authState.user.role) : false;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}