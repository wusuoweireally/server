import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user.module';
import { WallpaperModule } from './wallpaper.module';
import { ForumModule } from './forum.module';
import { TagModule } from './tag.module';
import { AdminUserController } from '../controllers/admin/admin-user.controller';
import { AdminWallpaperController } from '../controllers/admin/admin-wallpaper.controller';
import { AdminReportController } from '../controllers/admin/admin-report.controller';
import { AdminDashboardController } from '../controllers/admin/admin-dashboard.controller';
import { RolesGuard } from '../guards/roles.guard';
import { User } from '../entities/user.entity';
import { Wallpaper } from '../entities/wallpaper.entity';
import { Post } from '../entities/post.entity';
import { Report } from '../entities/report.entity';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Module({
  imports: [
    UserModule,
    WallpaperModule,
    ForumModule,
    TagModule,
    TypeOrmModule.forFeature([User, Wallpaper, Post, Report]),
  ],
  controllers: [
    AdminUserController,
    AdminWallpaperController,
    AdminReportController,
    AdminDashboardController,
  ],
  providers: [RolesGuard, AdminDashboardService],
})
export class AdminModule {}
