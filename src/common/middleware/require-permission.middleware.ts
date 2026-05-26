import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reusable permission-based authorization middleware factory.
 * Normalizes colon-separated, dot-separated and underscore-based formats
 * to ensure maximum compatibility.
 *
 * @param permissionKey The permission key required (e.g. 'student:read', 'follow_up:close')
 */
export function requirePermission(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { roles?: string[] } | undefined;

    if (!user || !user.roles) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        required: permissionKey,
      });
    }

    const userRoles = user.roles;

    // Admin role passes all permission checks
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
      return next();
    }

    try {
      // Load permissions from the database
      const dbRoles = await prisma.role.findMany({
        where: {
          name: { in: userRoles },
        },
        include: {
          permissions: true,
        },
      });

      const userPermissions = dbRoles.flatMap((r) => r.permissions.map((p) => p.name));

      // Normalization function to handle dot, colon, and underscores
      const normalize = (perm: string) =>
        perm.toLowerCase().replace(/_/g, '').replace(/:/g, '.');

      const normRequired = normalize(permissionKey);

      const isAuthorized = userPermissions.some((p) => {
        const normUserPerm = normalize(p);
        if (normUserPerm === normRequired) {
          return true;
        }
        if (normUserPerm.endsWith('.*')) {
          const prefix = normUserPerm.slice(0, -1); // e.g. "student."
          return normRequired.startsWith(prefix);
        }
        return false;
      });

      if (!isAuthorized) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          required: permissionKey,
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        required: permissionKey,
      });
    }
  };
}
