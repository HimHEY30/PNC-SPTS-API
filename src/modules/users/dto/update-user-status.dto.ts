import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED'])
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
}
