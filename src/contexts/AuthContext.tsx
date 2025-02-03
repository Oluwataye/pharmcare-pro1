import React, { createContext, useContext, useState } from 'react';
import { AuthState, User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getMockUser, validateUserRole } from '@/services/mockAuthService';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  
  const { toast } = useToast();
  const { logUserActivity } = useActivityLogger();

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const mockUser = getMockUser(email);
      
      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });

      logUserActivity('LOGIN', mockUser);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    logUserActivity('LOGOUT', authState.user);
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    return validateUserRole(authState.user, allowedRoles);
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