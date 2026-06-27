import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { AssignFollowUpCaseDto } from './dto/assign-follow-up-case.dto';
import { CompleteFollowUpCaseDto } from './dto/complete-follow-up-case.dto';
import { RejectFollowUpCaseDto } from './dto/reject-follow-up-case.dto';
import { FollowUpService } from './follow-up.service';

@ApiTags('follow-up-case-assignments')
@ApiSecurity('bearer')
@Controller('follow-up-cases')
export class FollowUpCaseAssignmentController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post(':caseId/assign')
  @Roles('ADMIN', 'ACADEMIC_MANAGER', 'EDUCATION_MANAGER')
  @ApiOperation({ summary: 'Assign a follow-up case to a teacher/tutor' })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiBody({ type: AssignFollowUpCaseDto })
  @ApiResponse({ status: 201, description: 'Case assigned successfully.' })
  assignCase(
    @Param('caseId') caseId: string,
    @Body() dto: AssignFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.assignCase(caseId, dto, req.user);
  }

  @Post(':caseId/accept')
  @ApiOperation({ summary: 'Accept an assigned follow-up case' })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiResponse({ status: 201, description: 'Case assignment accepted.' })
  acceptCase(@Param('caseId') caseId: string, @Req() req: Request) {
    return this.followUpService.acceptCase(caseId, req.user);
  }

  @Post(':caseId/reject')
  @ApiOperation({ summary: 'Reject an assigned follow-up case' })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiBody({ type: RejectFollowUpCaseDto })
  @ApiResponse({ status: 201, description: 'Case assignment rejected.' })
  rejectCase(
    @Param('caseId') caseId: string,
    @Body() dto: RejectFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.rejectCase(caseId, dto, req.user);
  }

  @Post(':caseId/complete')
  @ApiOperation({ summary: 'Complete an assigned follow-up case' })
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiBody({ type: CompleteFollowUpCaseDto })
  @ApiResponse({ status: 201, description: 'Case assignment completed.' })
  completeCase(
    @Param('caseId') caseId: string,
    @Body() dto: CompleteFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.completeCase(caseId, dto, req.user);
  }
}
