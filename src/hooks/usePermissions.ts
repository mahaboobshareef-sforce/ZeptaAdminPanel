import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasPermission, hasAnyPermission, Permission } from '../config/permissions';

export function usePermissions() {
  const { profile } = useAuth();

  const permissions = useMemo(() => {
    if (!profile) {
      return {
        can: () => false,
        canAny: () => false,
        isSuperAdmin: false,
        isAdmin: false,
      };
    }

    return {
      can: (permission: Permission) => hasPermission(profile.role, permission),
      canAny: (permissions: Permission[]) => hasAnyPermission(profile.role, permissions),
      isSuperAdmin: profile.role === 'super_admin',
      isAdmin: profile.role === 'admin',
    };
  }, [profile]);

  return permissions;
}
