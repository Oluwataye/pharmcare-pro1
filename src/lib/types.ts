
export type UserRole = 'SUPER_ADMIN' | 'PHARMACIST' | 'CASHIER';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string; // Add optional username property
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'inventory' | 'sales' | 'users' | 'settings' | 'reports' | 'wholesale';
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
  ],
  PHARMACIST: [
    { action: 'create', resource: 'inventory' },
    { action: 'read', resource: 'inventory' },
    { action: 'update', resource: 'inventory' },
    { action: 'delete', resource: 'inventory' },
    { action: 'read', resource: 'sales' },
    { action: 'create', resource: 'sales' }, // Added create sales permission
    { action: 'update', resource: 'sales' }, // Added update sales permission
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
    { action: 'update', resource: 'wholesale' },
  ],
  CASHIER: [
    { action: 'create', resource: 'sales' },
    { action: 'read', resource: 'sales' },
    { action: 'read', resource: 'inventory' },
    { action: 'create', resource: 'wholesale' },
    { action: 'read', resource: 'wholesale' },
  ],
};
