import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserRole } from '../entities/user.entity';

interface JwtPayload {
  sub: number | string; // sub 可能是数字或字符串
  username: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const cookieExtractor = (request: Request) => {
      const cookies = request?.cookies as Record<string, string>;
      const token = cookies?.Authentication || null;
      return token;
    };

    const secretOrKey =
      configService.get<string>('JWT_SECRET') || 'your-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false, // 确保过期token被拒绝
      secretOrKey: secretOrKey, // 使用环境变量
    });
  }

  async validate(payload: JwtPayload) {
    // 验证payload的有效性
    if (!payload) {
      throw new UnauthorizedException('JWT token无效 - payload为空');
    }
    if (!payload.sub) {
      throw new UnauthorizedException('JWT token无效 - 缺少用户ID');
    }
    if (!payload.username) {
      throw new UnauthorizedException('JWT token无效 - 缺少用户名');
    }

    // 将 sub 转换为数字（兼容字符串和数字类型）
    const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;

    // 验证用户ID的有效性
    if (isNaN(userId)) {
      throw new UnauthorizedException('用户ID无效 - 转换失败');
    }
    if (userId <= 0) {
      throw new UnauthorizedException('用户ID无效 - 必须是正数');
    }

    const result = {
      userId,
      username: payload.username,
      role: payload.role || UserRole.USER,
    };

    console.log('✅ JWT validation successful, returning:', JSON.stringify(result));
    return result;
  }
}
