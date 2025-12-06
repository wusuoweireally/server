import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallpaper } from '../entities/wallpaper.entity';
import { Post, PostStatus } from '../entities/post.entity';
import { Report, ReportStatus } from '../entities/report.entity';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalWallpapers: number;
  newWallpapersThisMonth: number;
  totalPosts: number;
  newPostsThisMonth: number;
  totalReports: number;
  pendingReports: number;
}

export interface RecentActivityItem {
  id: number;
  reason: Report['reason'];
  status: ReportStatus;
  createdAt: Date;
  reporterId: number;
  reporterUsername?: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  private getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { start, end } = this.getCurrentMonthRange();

    const [
      totalUsers,
      activeUsers,
      totalWallpapers,
      newWallpapersThisMonth,
      totalPosts,
      newPostsThisMonth,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: 1 } }),
      this.wallpaperRepository.count(),
      this.wallpaperRepository.count({
        where: {
          status: 1,
          createdAt: Between(start, end),
        },
      }),
      this.postRepository.count({ where: { status: PostStatus.PUBLISHED } }),
      this.postRepository.count({
        where: {
          status: PostStatus.PUBLISHED,
          createdAt: Between(start, end),
        },
      }),
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalWallpapers,
      newWallpapersThisMonth,
      totalPosts,
      newPostsThisMonth,
      totalReports,
      pendingReports,
    };
  }

  async getRecentActivity(limit = 8): Promise<RecentActivityItem[]> {
    const reports = await this.reportRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
      reporterId: report.userId,
      reporterUsername: report.user?.username,
    }));
  }
}
