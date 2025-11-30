import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUserType } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserType & { role?: UserRole };
    }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('没有访问此资源的权限');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('当前账号无权执行该操作');
    }

    return true;
  }
}
