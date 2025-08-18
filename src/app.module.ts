import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WallpaperModule } from './wallpaper/wallpaper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WallpaperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
