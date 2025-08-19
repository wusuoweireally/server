import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 生成随机用户名
  private generateRandomUsername(): string {
    const adjectives = [
      '快乐的',
      '聪明的',
      '勇敢的',
      '优雅的',
      '神秘的',
      '活泼的',
      '温柔的',
      '可爱的',
    ];
    const nouns = ['用户', '朋友', '探索者', '旅行者', '梦想家', '创造者'];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 10000);
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  }

  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户ID是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { id: createUserDto.id },
    });
    if (existingUser) {
      throw new ConflictException('用户ID已存在');
    }

    // 检查邮箱是否已存在
    if (createUserDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 生成用户名（如果没有提供）
    let username = createUserDto.username;
    if (!username) {
      username = this.generateRandomUsername();
      // 确保生成的用户名是唯一的
      let isUnique = false;
      while (!isUnique) {
        const existingUsername = await this.userRepository.findOne({
          where: { username },
        });
        if (!existingUsername) {
          isUnique = true;
        } else {
          username = this.generateRandomUsername();
        }
      }
    } else {
      // 检查用户名是否已存在
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      id: createUserDto.id,
      username,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      avatarUrl: createUserDto.avatarUrl || 'defaultAvatar.png', // 设置默认头像
    });

    return await this.userRepository.save(user);
  }

  // 验证用户登录
  async validateUser(id: number, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id, status: 1 },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }

    return null;
  }

  // 根据ID查找用户
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  // 查询所有用户
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  // 根据用户名搜索用户
  async findByUsername(
    username: string,
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { username: Like(`%${username}%`) },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  // 更新用户信息
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // 检查用户名是否已存在（如果要更新用户名）
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 检查邮箱是否已存在（如果要更新邮箱）
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 更新字段
    if (updateUserDto.username) {
      user.username = updateUserDto.username;
    }
    if (updateUserDto.email) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.avatarUrl) {
      user.avatarUrl = updateUserDto.avatarUrl;
    }

    return await this.userRepository.save(user);
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  // 禁用/启用用户
  async toggleStatus(id: number): Promise<User> {
    const user = await this.findById(id);
    user.status = user.status === 1 ? 0 : 1;
    return await this.userRepository.save(user);
  }

  // 更新用户头像
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }
}
