import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { hasPermission } from '../../modules/permissions/role-permission.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (!user) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Authentication is required.',
      });
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(user.roles, permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    return true;
  }
}
