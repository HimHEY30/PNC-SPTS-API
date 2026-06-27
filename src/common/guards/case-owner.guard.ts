import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CaseOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Authentication is required.',
      });
    }

    // Admins and Super Admins bypass checks
    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')) {
      return true;
    }

    const caseId = request.params.id ?? request.params.caseId;
    if (!caseId) {
      return true;
    }

    const followUpCase = await this.prisma.followUpCase.findUnique({
      where: { id: caseId },
      include: { openedByTeacher: true },
    });

    if (!followUpCase || followUpCase.deletedAt) {
      throw new NotFoundException({
        error: 'CASE_NOT_FOUND',
        message: 'The requested follow-up case does not exist.',
      });
    }

    // Allow if the user created the case (either by matched teacher entity's userId or direct createdBy string check)
    const isOwner =
      followUpCase.createdBy === user.user_id ||
      followUpCase.openedByTeacher.userId === user.user_id;

    if (!isOwner) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to modify this follow-up case.',
      });
    }

    return true;
  }
}
