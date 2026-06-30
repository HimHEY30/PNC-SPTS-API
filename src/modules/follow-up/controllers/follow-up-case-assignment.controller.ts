import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { FollowUpService } from '../services/follow-up.service';
import { AssignFollowUpCaseDto } from '../dto/assign-follow-up-case.dto';
import { RejectFollowUpCaseDto } from '../dto/reject-follow-up-case.dto';
import { CompleteFollowUpCaseDto } from '../dto/complete-follow-up-case.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Request } from 'express';

/**
 * Handles the assignment lifecycle of a follow-up case:
 * assign -> (teacher/tutor) accept | reject -> complete
 *
 * Side effects (email notification, audit log, in-app notification) are NOT
 * handled here directly. Each action below calls the corresponding
 * FollowUpService method, which publishes a FollowUpCaseEvent through
 * FollowUpCaseEventBus. The event bus fans that event out to:
 *   - EmailNotificationHandler -> emails the teacher/tutor (on assign) or
 *     the assigner (on reject/complete)
 *   - AuditLogHandler          -> writes an audit log entry
 *   - NotificationHandler      -> writes an in-app notification
 */
@ApiTags('follow-up')
@ApiSecurity('bearer')
@Controller('follow-up')
@UseGuards(JwtAuthGuard)
export class FollowUpCaseAssignmentController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post('cases/:caseId/assign')
  @ApiOperation({
    summary: 'Assign a follow-up case to a teacher or tutor',
    description:
      'Assigns the case to the given teacher/tutor and creates a PENDING ' +
      'assignment. Any previously active (PENDING/ACCEPTED) assignment for ' +
      'this case is automatically marked REJECTED. The assignee receives an ' +
      'email notification asking them to confirm or reject the case, plus ' +
      'an in-app notification.',
  })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiResponse({ status: 201, description: 'Case assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Case or assignee not found.' })
  async assign(
    @Param('caseId') caseId: string,
    @Body() dto: AssignFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.assignCase(caseId, dto, req.user);
  }

  @Post('cases/:caseId/accept')
  @ApiOperation({
    summary: 'Accept an assigned follow-up case',
    description:
      'Called by the assigned teacher/tutor to confirm they will handle the ' +
      'case. Looks up the case\'s currently active (PENDING) assignment, ' +
      'marks it ACCEPTED, and notifies the person who made the assignment.',
  })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiResponse({ status: 200, description: 'Assignment accepted.' })
  @ApiResponse({ status: 404, description: 'Case or active assignment not found.' })
  async accept(@Param('caseId') caseId: string, @Req() req: Request) {
    return this.followUpService.acceptCase(caseId, req.user);
  }

  @Post('cases/:caseId/reject')
  @ApiOperation({
    summary: 'Reject an assigned follow-up case',
    description:
      'Called by the assigned teacher/tutor to decline the case, with a ' +
      'required reason. Marks the case\'s active assignment REJECTED and ' +
      'emails the person who made the assignment so it can be reassigned.',
  })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiResponse({ status: 200, description: 'Assignment rejected.' })
  @ApiResponse({ status: 404, description: 'Case or active assignment not found.' })
  async reject(
    @Param('caseId') caseId: string,
    @Body() dto: RejectFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.rejectCase(caseId, dto, req.user);
  }

  @Post('cases/:caseId/complete')
  @ApiOperation({
    summary: 'Mark an accepted follow-up case assignment as completed',
    description:
      'Called by the assigned teacher/tutor once follow-up work is done. ' +
      'Marks the case\'s active (ACCEPTED) assignment COMPLETED and emails ' +
      'the person who made the assignment with the completion summary.',
  })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiResponse({ status: 200, description: 'Assignment marked completed.' })
  @ApiResponse({ status: 404, description: 'Case or active assignment not found.' })
  async complete(
    @Param('caseId') caseId: string,
    @Body() dto: CompleteFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.completeCase(caseId, dto, req.user);
  }
}
