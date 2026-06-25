import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { UpdateFollowUpCaseDto } from './dto/update-follow-up-case.dto';
import { MoveCaseDto } from './dto/move-case.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CaseOwnerGuard } from '../../common/guards/case-owner.guard';
import { Request } from 'express';

@ApiTags('follow-up')
@ApiSecurity('bearer')
@Controller('follow-up')
@UseGuards(JwtAuthGuard)
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post('cases')
  @ApiOperation({ summary: 'Create a new follow-up case' })
  @ApiResponse({ status: 201, description: 'Case created successfully.' })
  createCase(@Body() dto: CreateFollowUpCaseDto, @Req() req: Request) {
    return this.followUpService.createCase(dto, req.user);
  }

  @Get('board')
  @ApiOperation({ summary: 'Get follow-up cases grouped by status for the Kanban board' })
  @ApiResponse({ status: 200, description: 'Kanban columns grouped by status.' })
  getBoard() {
    return this.followUpService.getBoardData();
  }

  @Get('cases')
  @ApiOperation({ summary: 'Get paginated list of follow-up cases' })
  @ApiResponse({ status: 200, description: 'List of cases.' })
  findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.followUpService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a single follow-up case by ID' })
  @ApiResponse({ status: 200, description: 'Case details.' })
  findOne(@Param('id') id: string) {
    return this.followUpService.findOne(id);
  }

  @Put('cases/:id')
  @UseGuards(CaseOwnerGuard)
  @ApiOperation({ summary: 'Update a follow-up case' })
  @ApiResponse({ status: 200, description: 'Case updated.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.updateCase(id, dto, req.user);
  }

  @Patch('board/move/:id')
  @UseGuards(CaseOwnerGuard)
  @ApiOperation({ summary: 'Change a case status (drag and drop)' })
  @ApiResponse({ status: 200, description: 'Case moved successfully.' })
  moveCase(
    @Param('id') id: string,
    @Body() dto: MoveCaseDto,
    @Req() req: Request,
  ) {
    return this.followUpService.moveCase(id, dto.status, req.user);
  }

  @Delete('cases/:id')
  @UseGuards(CaseOwnerGuard)
  @ApiOperation({ summary: 'Soft-delete a follow-up case' })
  @ApiResponse({ status: 200, description: 'Case deleted.' })
  remove(@Param('id') id: string) {
    return this.followUpService.removeCase(id);
  }
}
