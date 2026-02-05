
import { useAuth } from "@/contexts/AuthContext";
import { Permission, ROLE_PERMISSIONS } from "@/lib/types";
import { useCallback } from "react";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;

    // Special case: all users can access and manage sales (both retail and wholesale)
    if (permission.resource === 'sales' || permission.resource === 'wholesale') {
      return true;
    }

    // Special case: DISPENSER can't access inventory
    if (user.role === 'DISPENSER' && permission.resource === 'inventory') {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role];
    if (!rolePermissions) return false;

    return rolePermissions.some(
      (p) => p.action === permission.action && p.resource === permission.resource
    );
  }, [user]);

  const canAccessInventory = useCallback((): boolean => {
    if (user?.role === 'DISPENSER') return false;
    return hasPermission({ action: 'read', resource: 'inventory' });
  }, [user, hasPermission]);

  const canManageInventory = useCallback((): boolean => {
    if (user?.role === 'DISPENSER') return false;
    return hasPermission({ action: 'create', resource: 'inventory' });
  }, [user, hasPermission]);

  const canAccessSales = useCallback((): boolean => {
    return true;
  }, []);

  const canManageSales = useCallback((): boolean => {
    return true;
  }, []);

  const canAccessUsers = useCallback((): boolean => {
    return hasPermission({ action: 'read', resource: 'users' });
  }, [hasPermission]);

  const canManageUsers = useCallback((): boolean => {
    return hasPermission({ action: 'create', resource: 'users' });
  }, [hasPermission]);

  const canEditUsers = useCallback((): boolean => {
    return hasPermission({ action: 'update', resource: 'users' });
  }, [hasPermission]);

  const canDeleteUsers = useCallback((): boolean => {
    return hasPermission({ action: 'delete', resource: 'users' });
  }, [hasPermission]);

  const canResetPassword = useCallback((): boolean => {
    return hasPermission({ action: 'update', resource: 'users' });
  }, [hasPermission]);

  const canAccessReports = useCallback((): boolean => {
    return hasPermission({ action: 'read', resource: 'reports' });
  }, [hasPermission]);

  const canCreateWholesale = useCallback((): boolean => {
    return true;
  }, []);

  const canReadWholesale = useCallback((): boolean => {
    return true;
  }, []);

  const canManageWholesale = useCallback((): boolean => {
    return true;
  }, []);

  const canAccessShifts = useCallback((): boolean => {
    return hasPermission({ action: 'read', resource: 'shifts' });
  }, [hasPermission]);

  const canAccessSuppliers = useCallback((): boolean => {
    return hasPermission({ action: 'read', resource: 'suppliers' });
  }, [hasPermission]);

  const canAccessExpenses = useCallback((): boolean => {
    return hasPermission({ action: 'read', resource: 'expenses' });
  }, [hasPermission]);

  const canManageExpenses = useCallback((): boolean => {
    return hasPermission({ action: 'create', resource: 'expenses' });
  }, [hasPermission]);

  const canAccessTraining = useCallback((): boolean => {
    // Only SUPER_ADMIN can access training
    return user?.role === 'SUPER_ADMIN';
  }, [user]);

  const canAccessCredit = useCallback((): boolean => {
    // Only SUPER_ADMIN can access credit management
    return user?.role === 'SUPER_ADMIN';
  }, [user]);

  return {
    hasPermission,
    canAccessInventory,
    canManageInventory,
    canAccessSales,
    canManageSales,
    canAccessUsers,
    canManageUsers,
    canEditUsers,
    canDeleteUsers,
    canResetPassword,
    canAccessReports,
    canCreateWholesale,
    canReadWholesale,
    canManageWholesale,
    canAccessShifts,
    canAccessSuppliers,
    canAccessExpenses,
    canManageExpenses,
    canAccessTraining,
    canAccessCredit,
  };
}
