import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ReportService } from '../../services/report.service';
import { GetReportsDto, UpdateReportDto } from '../../dto/report.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { CurrentUserType } from '../../decorators/current-user.decorator';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async list(@Query() query: GetReportsDto) {
    const reports = await this.reportService.getReports(query);
    return {
      success: true,
      message: '获取举报列表成功',
      data: reports.data,
      pagination: {
        page: reports.page,
        limit: reports.limit,
        total: reports.total,
        pages: Math.ceil(reports.total / reports.limit),
      },
    };
  }

  @Get('stats/overview')
  async stats() {
    const stats = await this.reportService.getReportStats();
    return {
      success: true,
      message: '获取举报统计成功',
      data: stats,
    };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    const report = await this.reportService.getReportById(id);
    return {
      success: true,
      message: '获取举报成功',
      data: report,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser() admin: CurrentUserType,
  ) {
    const report = await this.reportService.updateReportStatus(
      id,
      dto,
      admin.userId,
    );
    return {
      success: true,
      message: '更新举报状态成功',
      data: report,
    };
  }
}
