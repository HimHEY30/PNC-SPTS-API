import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles.
 * SUPER_ADMIN and ADMIN always pass this check (enforced in RolesGuard).
 *
 * @example
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get()
 * findAll() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
