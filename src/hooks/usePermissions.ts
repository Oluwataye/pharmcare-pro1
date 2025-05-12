
import { useAuth } from "@/contexts/AuthContext";
import { Permission, ROLE_PERMISSIONS } from "@/lib/types";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Special case: all users can access and manage sales
    if (permission.resource === 'sales') {
      return true;
    }
    
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
    // All users can access sales
    return true;
  };

  const canManageSales = (): boolean => {
    // All users can manage sales
    return true;
  };

  const canAccessUsers = (): boolean => {
    return hasPermission({ action: 'read', resource: 'users' });
  };

  const canManageUsers = (): boolean => {
    return hasPermission({ action: 'create', resource: 'users' });
  };

  const canEditUsers = (): boolean => {
    return hasPermission({ action: 'update', resource: 'users' });
  };

  const canDeleteUsers = (): boolean => {
    return hasPermission({ action: 'delete', resource: 'users' });
  };
  
  const canResetPassword = (): boolean => {
    return hasPermission({ action: 'update', resource: 'users' });
  };

  const canAccessReports = (): boolean => {
    return hasPermission({ action: 'read', resource: 'reports' });
  };

  const canCreateWholesale = (): boolean => {
    return hasPermission({ action: 'create', resource: 'wholesale' });
  };

  const canReadWholesale = (): boolean => {
    return hasPermission({ action: 'read', resource: 'wholesale' });
  };

  const canManageWholesale = (): boolean => {
    return hasPermission({ action: 'update', resource: 'wholesale' });
  };

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
