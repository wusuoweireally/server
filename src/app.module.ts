import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

//用户自定义的模块
import { UserModule } from './modules/user.module';
import { WallpaperModule } from './modules/wallpaper.module';
import { TagModule } from './modules/tag.module';
import { ForumModule } from './modules/forum.module';
import { databaseConfig } from './config/database.config';
import { AdminModule } from './modules/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    HttpModule,
    ScheduleModule.forRoot(),
    UserModule,
    WallpaperModule,
    TagModule,
    ForumModule,
    AdminModule,
  ],
})
export class AppModule {}
