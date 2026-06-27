import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiSecurity('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get summary data for the dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard summary data fetched successfully.' })
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
