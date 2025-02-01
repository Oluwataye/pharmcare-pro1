import React, { createContext, useContext, useState } from 'react';
import { AuthState, User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      // TODO: Replace with actual API call
      // Mock different user roles for testing
      let mockUser: User;
      
      if (email.includes('admin')) {
        mockUser = {
          id: '1',
          email,
          name: 'Admin User',
          role: 'ADMIN',
          lastLogin: new Date().toISOString(),
        };
      } else if (email.includes('pharmacist')) {
        mockUser = {
          id: '2',
          email,
          name: 'Pharmacist User',
          role: 'PHARMACIST',
          lastLogin: new Date().toISOString(),
        };
      } else if (email.includes('cashier')) {
        mockUser = {
          id: '3',
          email,
          name: 'Cashier User',
          role: 'CASHIER',
          lastLogin: new Date().toISOString(),
        };
      } else {
        throw new Error('Invalid credentials');
      }

      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });

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