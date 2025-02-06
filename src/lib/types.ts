export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
  last_sign_in?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DashboardStat {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  trendUp?: boolean;
}