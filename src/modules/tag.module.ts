import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagController } from '../controllers/tag.controller';
import { TagService } from '../services/tag.service';
import { Tag } from '../entities/tag.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, WallpaperTag])],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}