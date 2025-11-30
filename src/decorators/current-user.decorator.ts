import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export interface CurrentUserType {
  userId: number;
  username: string;
  role?: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserType }>();
    const user = request.user;

    // 验证用户信息的有效性
    if (!user || !user.userId || !user.username) {
      throw new UnauthorizedException('用户认证信息无效');
    }

    // 验证用户ID的有效性
    if (isNaN(user.userId) || user.userId <= 0) {
      throw new UnauthorizedException('用户ID无效');
    }

    return user;
  },
);
