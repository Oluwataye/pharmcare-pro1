
import React, { createContext, useContext, useState } from 'react';
import { AuthState, User, UserRole } from '@/lib/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      // Map email to appropriate role
      let role: UserRole = "ADMIN"; // Default role
      let name = "John Doe"; // Default name
      
      if (email === "cashier@demo.com" && password === "cashier123") {
        role = "CASHIER";
        name = "Cashier User";
      } else if (email === "pharmacist@demo.com" && password === "pharmacist123") {
        role = "PHARMACIST";
        name = "Pharmacist User";
      } else if (email === "admin@demo.com" && password === "admin123") {
        role = "ADMIN";
        name = "Admin User";
      } else if (email !== "admin@demo.com") {
        // If email doesn't match any predefined user and it's not the default admin
        throw new Error("Invalid credentials");
      }

      const mockUser: User = {
        id: '1',
        email,
        name,
        role,
      };
      
      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
