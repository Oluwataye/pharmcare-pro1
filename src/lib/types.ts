
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PHARMACIST' | 'DISPENSER';

export interface User {
  id: string;
  currency_symbol: string;
  low_stock_threshold_global?: number;
  enable_low_stock_alerts?: boolean;
  enable_backup_alerts?: boolean;
  email: string;
  name: string;
  username?: string; // Add optional username property
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired?: boolean;
}

export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'inventory' | 'sales' | 'users' | 'settings' | 'reports' | 'wholesale' | 'shifts' | 'suppliers' | 'expenses';
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    { action: 'create', resource: 'inventory' },
    { action: 'read', resource: 'inventory' },
    { action: 'update', resource: 'inventory' },
    { action: 'delete', resource: 'inventory' },
    { action: 'create', resource: 'sales' },
    { action: 'read', resource: 'sales' },
    { action: 'update', resource: 'sales' },
    { action: 'delete', resource: 'sales' },
    { action: 'create', resource: 'users' },
    { action: 'read', resource: 'users' },
    { action: 'update', resource: 'users' },
    { action: 'delete', resource: 'users' },
    { action: 'read', resource: 'reports' },
    { action: 'update', resource: 'settings' },
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
    { action: 'update', resource: 'wholesale' },
    { action: 'delete', resource: 'wholesale' },
    { action: 'read', resource: 'shifts' },
    { action: 'update', resource: 'shifts' },
    { action: 'read', resource: 'suppliers' },
    { action: 'create', resource: 'expenses' },
    { action: 'read', resource: 'expenses' },
    { action: 'update', resource: 'expenses' },
    { action: 'delete', resource: 'expenses' },
  ],
  ADMIN: [
    { action: 'create', resource: 'inventory' },
    { action: 'read', resource: 'inventory' },
    { action: 'update', resource: 'inventory' },
    { action: 'create', resource: 'sales' },
    { action: 'read', resource: 'sales' },
    { action: 'update', resource: 'sales' },
    { action: 'read', resource: 'reports' },
    { action: 'update', resource: 'settings' },
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
    { action: 'update', resource: 'wholesale' },
    { action: 'read', resource: 'shifts' },
    { action: 'update', resource: 'shifts' },
    { action: 'read', resource: 'suppliers' },
    { action: 'create', resource: 'expenses' },
    { action: 'read', resource: 'expenses' },
    { action: 'update', resource: 'expenses' },
    { action: 'delete', resource: 'expenses' },
  ],
  PHARMACIST: [
    { action: 'create', resource: 'inventory' },
    { action: 'read', resource: 'inventory' },
    { action: 'update', resource: 'inventory' },
    { action: 'delete', resource: 'inventory' },
    { action: 'read', resource: 'sales' },
    { action: 'create', resource: 'sales' },
    { action: 'update', resource: 'sales' },
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
    { action: 'update', resource: 'wholesale' },
  ],
  DISPENSER: [
    { action: 'create', resource: 'sales' },
    { action: 'read', resource: 'sales' },
    { action: 'read', resource: 'inventory' },
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
  ],
};
