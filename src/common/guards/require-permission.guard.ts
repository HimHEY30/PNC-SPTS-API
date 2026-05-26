import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Reusable dynamic NestJS Guard factory.
 * Can be applied at controller or route handler level.
 *
 * @param permissionKey The permission key required (e.g. 'student:read')
 */
export function requirePermissionGuard(permissionKey: string) {
  @Injectable()
  class PermissionGuard implements CanActivate {
    constructor(public readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user as { roles?: string[] } | undefined;

      if (!user || !user.roles) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          required: permissionKey,
        });
      }

      const userRoles = user.roles;

      // Admin role passes all permission checks
      if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
        return true;
      }

      const dbRoles = await this.prisma.role.findMany({
        where: {
          name: { in: userRoles },
        },
        include: {
          permissions: true,
        },
      });

      const userPermissions = dbRoles.flatMap((r) => r.permissions.map((p) => p.name));

      const normalize = (perm: string) =>
        perm.toLowerCase().replace(/_/g, '').replace(/:/g, '.');

      const normRequired = normalize(permissionKey);

      const isAuthorized = userPermissions.some((p) => {
        const normUserPerm = normalize(p);
        if (normUserPerm === normRequired) {
          return true;
        }
        if (normUserPerm.endsWith('.*')) {
          const prefix = normUserPerm.slice(0, -1);
          return normRequired.startsWith(prefix);
        }
        return false;
      });

      if (!isAuthorized) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          required: permissionKey,
        });
      }

      return true;
    }
  }

  return PermissionGuard;
}
