
import { useAuth } from "@/contexts/AuthContext";
import { Permission, ROLE_PERMISSIONS } from "@/lib/types";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.some(
      (p) => p.action === permission.action && p.resource === permission.resource
    );
  };

  const canAccessInventory = (): boolean => {
    return hasPermission({ action: 'read', resource: 'inventory' });
  };

  const canManageInventory = (): boolean => {
    return hasPermission({ action: 'create', resource: 'inventory' });
  };

  const canAccessSales = (): boolean => {
    return hasPermission({ action: 'read', resource: 'sales' });
  };

  const canManageSales = (): boolean => {
    return hasPermission({ action: 'create', resource: 'sales' });
  };

  const canAccessUsers = (): boolean => {
    return hasPermission({ action: 'read', resource: 'users' });
  };

  const canAccessReports = (): boolean => {
    return hasPermission({ action: 'read', resource: 'reports' });
  };

  return {
    hasPermission,
    canAccessInventory,
    canManageInventory,
    canAccessSales,
    canManageSales,
    canAccessUsers,
    canAccessReports,
  };
}
