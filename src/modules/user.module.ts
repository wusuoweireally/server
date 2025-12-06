import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UserController } from '../controllers/user.controller';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WallpaperModule } from './wallpaper.module';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn: StringValue = (configService.get<string>('JWT_EXPIRES_IN') || '180d') as StringValue;
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    WallpaperModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtStrategy, OptionalJwtAuthGuard],
  exports: [UserService, AuthService],
})
export class UserModule {}
