import { useState } from 'react';
import { AuthState, User } from '@/lib/types';

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const updateAuthState = (user: User | null) => {
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  };

  return {
    authState,
    updateAuthState,
    setAuthState,
  };
};