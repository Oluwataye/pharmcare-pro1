
import * as React from 'react';
import { AuthState, User, UserRole } from '@/lib/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      // Simulate network delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Map email to appropriate role
      let role: UserRole = "ADMIN"; // Default role
      let name = "John Doe"; // Default name
      let username = "admin"; // Default username
      
      if (email === "cashier@demo.com" && password === "cashier123") {
        role = "CASHIER";
        name = "Cashier User";
        username = "cashier1";
      } else if (email === "pharmacist@demo.com" && password === "pharmacist123") {
        role = "PHARMACIST";
        name = "Pharmacist User";
        username = "pharmacist1";
      } else if (email === "admin@demo.com" && password === "admin123") {
        role = "ADMIN";
        name = "Admin User";
        username = "admin";
      } else if (email !== "admin@demo.com") {
        // If email doesn't match any predefined user and it's not the default admin
        throw new Error("Invalid credentials");
      }

      const mockUser: User = {
        id: '1',
        email,
        name,
        username,
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
    // Simulate logout process
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate network delay
    setTimeout(() => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
