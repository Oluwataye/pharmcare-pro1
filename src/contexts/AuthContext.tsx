
import * as React from 'react';
import { AuthState, User, UserRole } from '@/lib/types';
import { loginSchema, validateAndSanitize } from '@/lib/validation';
import { secureStorage } from '@/lib/secureStorage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Demo users for testing - In production, this should be removed
const DEMO_USERS = [
  { email: 'cashier@demo.com', password: 'Cashier123!', role: 'CASHIER' as UserRole, name: 'Cashier User', username: 'cashier1' },
  { email: 'pharmacist@demo.com', password: 'Pharmacist123!', role: 'PHARMACIST' as UserRole, name: 'Pharmacist User', username: 'pharmacist1' },
  { email: 'admin@demo.com', password: 'Admin123!', role: 'ADMIN' as UserRole, name: 'Admin User', username: 'admin' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>(() => {
    // Check for existing session on app start
    const storedUser = secureStorage.getItem('auth_user');
    return {
      user: storedUser || null,
      isAuthenticated: !!storedUser,
      isLoading: false,
    };
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Validate input
      const validation = validateAndSanitize(loginSchema, { email, password });
      if (!validation.success) {
        throw new Error(validation.error || 'Invalid input');
      }

      // Simulate network delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in demo users
      const demoUser = DEMO_USERS.find(user => 
        user.email === validation.data!.email && user.password === validation.data!.password
      );

      if (!demoUser) {
        throw new Error('Invalid credentials');
      }

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        email: demoUser.email,
        name: demoUser.name,
        username: demoUser.username,
        role: demoUser.role,
      };
      
      // Store user securely
      secureStorage.setItem('auth_user', mockUser);
      
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
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Clear secure storage
    secureStorage.clear();
    
    // Simulate logout process
    setTimeout(() => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }, 500);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clean up any sensitive data when component unmounts
      if (!authState.isAuthenticated) {
        secureStorage.clear();
      }
    };
  }, [authState.isAuthenticated]);

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
