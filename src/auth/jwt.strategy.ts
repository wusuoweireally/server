import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request?.cookies as Record<string, string>;
          return cookies?.Authentication || null;
        },
      ]),
      ignoreExpiration: false, // 确保过期token被拒绝
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // 使用环境变量
    });
  }

  validate(payload: JwtPayload) {
    // 验证payload的有效性
    if (!payload || !payload.sub || !payload.username) {
      throw new UnauthorizedException('JWT token无效');
    }

    // 验证用户ID的有效性
    if (isNaN(payload.sub) || payload.sub <= 0) {
      throw new UnauthorizedException('用户ID无效');
    }

    return { userId: payload.sub, username: payload.username };
  }
}
