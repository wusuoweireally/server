import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { WallpaperController } from '../controllers/wallpaper.controller';
import { WallpaperService } from '../services/wallpaper.service';
import { UploadService } from '../services/upload.service';
import { ViewHistoryService } from '../services/view-history.service';
import { Wallpaper } from '../entities/wallpaper.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { Tag } from '../entities/tag.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { TagModule } from './tag.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Wallpaper, WallpaperTag, Tag, ViewHistory]),
    TagModule,
  ],
  controllers: [WallpaperController],
  providers: [WallpaperService, UploadService, ViewHistoryService],
  exports: [WallpaperService, UploadService, ViewHistoryService],
})
export class WallpaperModule {}
