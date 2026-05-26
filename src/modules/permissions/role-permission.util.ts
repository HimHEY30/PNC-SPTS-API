import {
  ROLE_HIERARCHY,
  ROLE_MANAGEMENT_SCOPE,
  ROLE_PERMISSIONS,
  SupportedRole,
} from './rbac.constants';

export function isSupportedRole(role: string): role is SupportedRole {
  return ROLE_HIERARCHY.includes(role as SupportedRole);
}

export function getHighestRole(roles: string[]): SupportedRole | null {
  for (const role of ROLE_HIERARCHY) {
    if (roles.includes(role)) {
      return role;
    }
  }
  return null;
}

export function getPermissionsForRoles(roles: string[]): string[] {
  const permissions = new Set<string>();

  for (const role of roles) {
    if (!isSupportedRole(role)) {
      continue;
    }

    for (const permission of ROLE_PERMISSIONS[role]) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

export function hasPermission(userRoles: string[], requiredPermission: string): boolean {
  const permissions = getPermissionsForRoles(userRoles);

  return permissions.some((permission) => {
    if (permission === requiredPermission) {
      return true;
    }

    if (permission.endsWith('.*')) {
      const prefix = permission.slice(0, -1);
      return requiredPermission.startsWith(prefix);
    }

    return false;
  });
}

export function canManageRole(userRoles: string[], targetRole: string): boolean {
  const highestRole = getHighestRole(userRoles);
  if (!highestRole || !isSupportedRole(targetRole)) {
    return false;
  }

  return ROLE_MANAGEMENT_SCOPE[highestRole].includes(targetRole);
}
