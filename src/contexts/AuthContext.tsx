
import * as React from 'react';
import { AuthState, User, UserRole } from '@/lib/types';
import { loginSchema, validateAndSanitize } from '@/lib/validation';
import { secureStorage } from '@/lib/secureStorage';
import { logSecurityEvent } from '@/components/security/SecurityProvider';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loginAttempts: number;
  isAccountLocked: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Maximum login attempts before account lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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

  const [loginAttempts, setLoginAttempts] = React.useState(0);
  const [lockoutTime, setLockoutTime] = React.useState<number | null>(null);

  // Check if account is locked
  const isAccountLocked = React.useMemo(() => {
    if (!lockoutTime) return false;
    return Date.now() < lockoutTime;
  }, [lockoutTime]);

  // Clear lockout after duration
  React.useEffect(() => {
    if (lockoutTime && Date.now() >= lockoutTime) {
      setLockoutTime(null);
      setLoginAttempts(0);
    }
  }, [lockoutTime]);

  const login = async (email: string, password: string) => {
    if (isAccountLocked) {
      const remainingTime = Math.ceil((lockoutTime! - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Validate input
      const validation = validateAndSanitize(loginSchema, { email, password });
      if (!validation.success) {
        logSecurityEvent('INVALID_LOGIN_INPUT', { email });
        throw new Error(validation.error || 'Invalid input');
      }

      // Simulate network delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would authenticate against a secure backend
      // For demo purposes, we'll use a basic check but log it as a security event
      const isDemoLogin = validation.data!.email.includes('@demo.com') && 
                         validation.data!.password.includes('123!');

      if (!isDemoLogin) {
        setLoginAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLockoutTime(Date.now() + LOCKOUT_DURATION);
            logSecurityEvent('ACCOUNT_LOCKED', { email: validation.data!.email, attempts: newAttempts });
          }
          return newAttempts;
        });
        
        logSecurityEvent('FAILED_LOGIN_ATTEMPT', { 
          email: validation.data!.email, 
          attempts: loginAttempts + 1 
        });
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      setLoginAttempts(0);
      setLockoutTime(null);

      // Create mock user based on email domain for demo
      let role: UserRole = 'CASHIER';
      if (validation.data!.email.includes('admin')) role = 'ADMIN';
      else if (validation.data!.email.includes('pharmacist')) role = 'PHARMACIST';

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: validation.data!.email,
        name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
        username: validation.data!.email.split('@')[0],
        role: role,
      };
      
      // Store user securely
      secureStorage.setItem('auth_user', mockUser);
      
      logSecurityEvent('SUCCESSFUL_LOGIN', { 
        email: validation.data!.email, 
        role: role,
        userId: mockUser.id 
      });
      
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
    
    if (authState.user) {
      logSecurityEvent('USER_LOGOUT', { 
        userId: authState.user.id,
        email: authState.user.email 
      });
    }
    
    // Clear all secure storage
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

  // Cleanup on unmount and clear sensitive data
  React.useEffect(() => {
    return () => {
      if (!authState.isAuthenticated) {
        secureStorage.clear();
      }
    };
  }, [authState.isAuthenticated]);

  // Auto-logout after session timeout
  React.useEffect(() => {
    if (authState.isAuthenticated) {
      const timeout = setTimeout(() => {
        logSecurityEvent('SESSION_TIMEOUT', { userId: authState.user?.id });
        logout();
      }, 8 * 60 * 60 * 1000); // 8 hours

      return () => clearTimeout(timeout);
    }
  }, [authState.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      loginAttempts, 
      isAccountLocked 
    }}>
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
