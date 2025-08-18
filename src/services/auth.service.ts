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

  async validateUser(id: string, password: string): Promise<User | null> {
    return await this.userService.validateUser(id, password);
  }

  login(user: User) {
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload, {
      expiresIn: '180d', // 180天过期
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
