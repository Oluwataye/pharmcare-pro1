export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
  last_sign_in: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}