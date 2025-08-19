import { Injectable } from '@nestjs/common';
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
      ignoreExpiration: false,
      secretOrKey: 'your-secret-key', // 生产环境中应该使用环境变量
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, username: payload.username };
  }
}
