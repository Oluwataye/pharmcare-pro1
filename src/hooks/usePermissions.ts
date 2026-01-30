
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
  };
}
