import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { UserModule } from './modules/user.module';
import { WallpaperModule } from './modules/wallpaper.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    HttpModule,
    UserModule,
    WallpaperModule,
  ],
})
export class AppModule {}
