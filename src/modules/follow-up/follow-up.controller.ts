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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { CreateFollowUpReportDto } from './dto/create-follow-up-report.dto';
import { UpdateFollowUpCaseDto } from './dto/update-follow-up-case.dto';
import { MoveCaseDto } from './dto/move-case.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CaseOwnerGuard } from '../../common/guards/case-owner.guard';
import { Request } from 'express';
import {
  ATTACHMENT_MAX_SIZE_BYTES,
  attachmentFileFilter,
  attachmentStorage,
} from '../../config/storage.config';

const attachmentInterceptorOptions = {
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: { fileSize: ATTACHMENT_MAX_SIZE_BYTES },
};

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

  @Post('cases/:caseId/reports')
  @UseGuards(CaseOwnerGuard)
  @UseInterceptors(FilesInterceptor('attachments', 10, attachmentInterceptorOptions))
  @ApiOperation({
    summary: 'Create a follow-up report with optional attachments',
    description:
      'Creates a report for a follow-up case and attaches up to 10 files in the same request.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'caseId', description: 'Follow-up case UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['teacherId'],
      properties: {
        teacherId: { type: 'string', format: 'uuid' },
        reportDate: { type: 'string', format: 'date-time' },
        progressStatus: { type: 'string' },
        observation: { type: 'string' },
        nextAction: { type: 'string' },
        attachments: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Report created successfully.' })
  @ApiResponse({ status: 404, description: 'Follow-up case not found.' })
  async createReport(
    @Param('caseId') caseId: string,
    @Body() dto: CreateFollowUpReportDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.followUpService.createReport(caseId, dto, files ?? []);
  }

  // ── Attachments ──────────────────────────────────────────────────────────────

  @Post('reports/:reportId/attachments')
  @UseInterceptors(FileInterceptor('file', attachmentInterceptorOptions))
  @ApiOperation({
    summary: 'Upload a single attachment to a follow-up report',
    description:
      'Attach a document file (PDF, Word, Excel, PowerPoint, Text, ZIP/RAR) ' +
      'to an existing follow-up report. Max file size: 10 MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'reportId', description: 'Follow-up report UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'No file provided or unsupported file type.' })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  async uploadAttachment(
    @Param('reportId') reportId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.followUpService.addAttachment(reportId, file);
  }

  @Post('reports/:reportId/attachments/batch')
  @UseInterceptors(FilesInterceptor('files', 10, attachmentInterceptorOptions))
  @ApiOperation({
    summary: 'Upload multiple attachments to a follow-up report (max 10 files)',
    description:
      'Attach multiple document files at once to an existing follow-up report. ' +
      'Supported formats: PDF, Word, Excel, PowerPoint, Text, ZIP/RAR. Max 10 MB per file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'reportId', description: 'Follow-up report UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachments uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'No files provided or unsupported file type.' })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  async uploadAttachmentsBatch(
    @Param('reportId') reportId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = [];
    for (const file of files) {
      const attachment = await this.followUpService.addAttachment(reportId, file);
      results.push(attachment);
    }
    return results;
  }

  @Get('reports/:reportId/attachments')
  @ApiOperation({ summary: 'List all attachments for a follow-up report' })
  @ApiParam({ name: 'reportId', description: 'Follow-up report UUID' })
  @ApiResponse({ status: 200, description: 'List of attachments.' })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  async getAttachments(@Param('reportId') reportId: string) {
    return this.followUpService.getAttachments(reportId);
  }
}
