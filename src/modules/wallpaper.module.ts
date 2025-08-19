import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WallpaperController } from '../controllers/wallpaper.controller';

@Module({
  imports: [HttpModule],
  controllers: [WallpaperController],
})
export class WallpaperModule {}
