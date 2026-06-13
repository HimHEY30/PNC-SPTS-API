/**
 * update-user-status.dto.ts
 *
 * B-03 — All four status values now have explicit handling in UsersService:
 *
 *   ACTIVE    → is_active = true  (normal account)
 *   INACTIVE  → is_active = false (disabled, not soft-deleted)
 *   SUSPENDED → is_active = false (temporary enforcement action)
 *   LOCKED    → is_active = false (auto-lock after failed logins / manual)
 *
 * The DTO itself is unchanged — all four values were already accepted.
 * The fix was in users.service.ts updateStatus().
 */

import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'])
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
}
