import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user || !user.roles) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Authentication is required.',
      });
    }

    const userRoles = user.roles;

    // Admin role passes all permission checks
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) {
      return true;
    }

    // Load permissions from the database
    const dbRoles = await this.prisma.role.findMany({
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

    // Verify all required permissions are satisfied
    for (const reqPerm of requiredPermissions) {
      const normRequired = normalize(reqPerm);

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
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          required: reqPerm,
        });
      }
    }

    return true;
  }
}
