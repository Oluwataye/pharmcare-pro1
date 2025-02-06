export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles: UserRole[];
}

export interface DashboardStat {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  trendUp?: boolean;
}