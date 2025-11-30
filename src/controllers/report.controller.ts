import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserType } from '../decorators/current-user.decorator';
import { CreateReportDto } from '../dto/report.dto';
import { ReportService } from '../services/report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 获取举报原因选项（公开接口）
   */
  @Get('reasons/options')
  async getReportReasons() {
    const reasons = await this.reportService.getReportReasons();
    return {
      success: true,
      message: '获取举报原因选项成功',
      data: reasons,
    };
  }

  /**
   * 创建举报
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const report = await this.reportService.createReport(createReportDto, user.userId);
    return {
      success: true,
      message: '举报提交成功，我们会尽快处理',
      data: report,
    };
  }

  /**
   * 获取当前用户的举报历史
   */
  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  async getUserReports(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1') || 1;
    const limitNum = parseInt(limit || '20') || 20;

    const reports = await this.reportService.getUserReports(user.userId, pageNum, limitNum);
    return {
      success: true,
      message: '获取用户举报历史成功',
      data: reports.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: reports.total,
        pages: Math.ceil(reports.total / limitNum),
      },
    };
  }

  /**
   * 检查是否可以举报
   */
  @Get('check/:targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  async checkCanReport(
    @Param('targetType') targetType: string,
    @Param('targetId', ParseIntPipe) targetId: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.reportService.checkCanReport(
      user.userId,
      targetType as any,
      targetId,
    );
    return {
      success: true,
      message: '检查完成',
      data: result,
    };
  }
}
