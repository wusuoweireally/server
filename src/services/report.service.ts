import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto, GetReportsDto, UpdateReportDto } from '../dto/report.dto';
import { Report, ReportReason, ReportStatus, ReportTargetType } from '../entities/report.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  /**
   * 创建举报
   */
  async createReport(createReportDto: CreateReportDto, userId: number): Promise<Report> {
    // 检查是否已经举报过
    const existingReport = await this.reportRepository.findOne({
      where: {
        userId,
        targetType: createReportDto.targetType,
        targetId: createReportDto.targetId,
      },
    });

    if (existingReport) {
      throw new ConflictException('您已经举报过此内容');
    }

    const report = this.reportRepository.create({
      userId,
      ...createReportDto,
    });

    return await this.reportRepository.save(report);
  }

  /**
   * 获取举报列表（管理员功能）
   */
  async getReports(getReportsDto: GetReportsDto): Promise<{ data: Report[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, targetType, reason, status, userId } = getReportsDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (targetType) {
      where.targetType = targetType;
    }

    if (reason) {
      where.reason = reason;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await this.reportRepository.findAndCount({
      where,
      relations: ['user', 'post', 'comment', 'reviewer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个举报详情
   */
  async getReportById(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['user', 'post', 'comment', 'reviewer'],
    });

    if (!report) {
      throw new NotFoundException('举报记录不存在');
    }

    return report;
  }

  /**
   * 更新举报状态（管理员功能）
   */
  async updateReportStatus(id: number, updateReportDto: UpdateReportDto, adminId: number): Promise<Report> {
    const report = await this.getReportById(id);

    // 检查是否已经是最终状态
    if (report.status === ReportStatus.RESOLVED || report.status === ReportStatus.DISMISSED) {
      throw new ForbiddenException('该举报已经处理完成');
    }

    // 更新状态
    const status =
      updateReportDto.status ??
      (updateReportDto.reviewNote ? ReportStatus.RESOLVED : ReportStatus.REVIEWING);

    await this.reportRepository.update(id, {
      status,
      reviewedBy: adminId,
      reviewNote: updateReportDto.reviewNote,
      updatedAt: new Date(),
    });

    return await this.getReportById(id);
  }

  /**
   * 获取用户的举报历史
   */
  async getUserReports(userId: number, page: number = 1, limit: number = 20): Promise<{ data: Report[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reportRepository.findAndCount({
      where: { userId },
      relations: ['post', 'comment'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  /**
   * 获取举报统计信息
   */
  async getReportStats(): Promise<any> {
    const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { status: ReportStatus.REVIEWING } }),
      this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepository.count({ where: { status: ReportStatus.DISMISSED } }),
    ]);

    // 按原因统计
    const statsByReason = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.reason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.reason')
      .getRawMany();

    // 按类型统计
    const statsByType = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.targetType', 'targetType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.targetType')
      .getRawMany();

    return {
      total,
      pending,
      reviewing,
      resolved,
      dismissed,
      statsByReason,
      statsByType,
    };
  }

  /**
   * 检查用户是否可以举报某个内容
   */
  async canReport(userId: number, targetType: ReportTargetType, targetId: number): Promise<boolean> {
    const existingReport = await this.reportRepository.findOne({
      where: {
        userId,
        targetType,
        targetId,
      },
    });

    return !existingReport;
  }

  /**
   * 检查是否可以举报（公开接口）
   */
  async checkCanReport(
    userId: number,
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<{ canReport: boolean; reason?: string }> {
    const canReport = await this.canReport(userId, targetType, targetId);
    return {
      canReport,
      reason: canReport ? undefined : '您已经举报过此内容',
    };
  }

  /**
   * 获取举报原因选项
   */
  getReportReasons(): Array<{ value: ReportReason; label: string; description: string }> {
    return [
      {
        value: ReportReason.SPAM,
        label: '垃圾信息',
        description: '广告、灌水、重复内容等',
      },
      {
        value: ReportReason.INAPPROPRIATE,
        label: '不当内容',
        description: '不适当、冒犯性或令人不适的内容',
      },
      {
        value: ReportReason.HARASSMENT,
        label: '骚扰行为',
        description: '人身攻击、霸凌、骚扰等',
      },
      {
        value: ReportReason.VIOLENCE,
        label: '暴力内容',
        description: '暴力、血腥或危险行为相关内容',
      },
      {
        value: ReportReason.COPYRIGHT,
        label: '版权问题',
        description: '侵犯版权、盗用他人作品等',
      },
      {
        value: ReportReason.MISINFORMATION,
        label: '虚假信息',
        description: '虚假、误导性或错误的信息',
      },
      {
        value: ReportReason.OTHER,
        label: '其他问题',
        description: '其他违规或问题内容',
      },
    ];
  }
}
