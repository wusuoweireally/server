import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(id: number, password: string): Promise<User | null> {
    return await this.userService.validateUser(id, password);
  }

  login(user: User) {
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '60d', // 使用环境变量或默认60天
      secret: process.env.JWT_SECRET || 'your-secret-key', // 使用环境变量
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
