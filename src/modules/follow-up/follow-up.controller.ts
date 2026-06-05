import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpCaseDto } from './dto/create-follow-up-case.dto';
import { UpdateFollowUpCaseDto } from './dto/update-follow-up-case.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('follow-up')
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post('cases')
  @ApiOperation({ summary: 'Create a new follow-up case' })
  @ApiResponse({ status: 201, description: 'Case created successfully.' })
  createCase(@Body() dto: CreateFollowUpCaseDto) {
    return this.followUpService.createCase(dto);
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
  @ApiOperation({ summary: 'Update a follow-up case' })
  @ApiResponse({ status: 200, description: 'Case updated.' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpCaseDto) {
    return this.followUpService.updateCase(id, dto);
  }

  @Delete('cases/:id')
  @ApiOperation({ summary: 'Delete a follow-up case' })
  @ApiResponse({ status: 200, description: 'Case deleted.' })
  remove(@Param('id') id: string) {
    return this.followUpService.removeCase(id);
  }
}
