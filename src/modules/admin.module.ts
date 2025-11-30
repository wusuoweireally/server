import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { WallpaperModule } from './wallpaper.module';
import { ForumModule } from './forum.module';
import { TagModule } from './tag.module';
import { AdminUserController } from '../controllers/admin/admin-user.controller';
import { AdminWallpaperController } from '../controllers/admin/admin-wallpaper.controller';
import { AdminReportController } from '../controllers/admin/admin-report.controller';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [UserModule, WallpaperModule, ForumModule, TagModule],
  controllers: [AdminUserController, AdminWallpaperController, AdminReportController],
  providers: [RolesGuard],
})
export class AdminModule {}
