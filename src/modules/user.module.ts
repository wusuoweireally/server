import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UserController } from '../controllers/user.controller';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '180d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtStrategy],
  exports: [UserService, AuthService],
})
export class UserModule {}
