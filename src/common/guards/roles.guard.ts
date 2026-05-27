import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Global guard that enforces role-based access control.
 *
 * - Routes decorated with @Public() are always allowed.
 * - Routes with no @Roles() metadata are always allowed (permission-level
 *   access control is handled separately by PermissionsGuard).
 * - SUPER_ADMIN and ADMIN automatically satisfy any role requirement.
 * - Otherwise, the authenticated user must have at least one of the
 *   roles listed in @Roles(...).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip guard for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // If no @Roles() metadata is set, allow all authenticated users through
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Authentication is required.',
      });
    }

    // Super-admins and admins bypass all role checks
    if (
      user.roles.includes('SUPER_ADMIN') ||
      user.roles.includes('ADMIN')
    ) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: `Access requires one of the following roles: ${requiredRoles.join(', ')}.`,
        required_roles: requiredRoles,
      });
    }

    return true;
  }
}
