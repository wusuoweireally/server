import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { AdminUpdateUserDto, AdminUserQueryDto } from '../dto/admin.dto';
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
  async create(
    createUserDto: CreateUserDto,
    roleOverride: UserRole = UserRole.USER,
  ): Promise<User> {
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

    const userRole =
      roleOverride === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;

    const user = this.userRepository.create({
      id: createUserDto.id,
      username,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      avatarUrl: 'defaultAvatar.png', // 默认头像
      bio: createUserDto.bio || '',
      role: userRole,
    });

    return await this.userRepository.save(user);
  }

  // 验证用户登录
  async validateUser(id: number, password: string): Promise<User | null> {
    // 验证ID的有效性
    if (!id || isNaN(id) || id <= 0) {
      return null;
    }

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
    // 验证ID的有效性
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('用户ID无效');
    }

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
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
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
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.avatarUrl) {
      user.avatarUrl = updateUserDto.avatarUrl;
    }
    if (updateUserDto.bio !== undefined) {
      user.bio = updateUserDto.bio;
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

  async setStatus(id: number, status: number): Promise<User> {
    const user = await this.findById(id);
    user.status = status === 1 ? 1 : 0;
    return await this.userRepository.save(user);
  }

  // 更新用户头像
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  async adminQueryUsers(
    query: AdminUserQueryDto,
  ): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 20, keyword, status, role } = query;
    const qb = this.userRepository.createQueryBuilder('user');

    if (keyword) {
      qb.andWhere(
        '(user.username LIKE :keyword OR user.email LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status !== undefined) {
      qb.andWhere('user.status = :status', { status });
    }

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    const [data, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async adminUpdateUser(
    id: number,
    updateDto: AdminUpdateUserDto,
  ): Promise<User> {
    const baseFields: UpdateUserDto = {
      username: updateDto.username,
      email: updateDto.email,
      password: updateDto.password,
      avatarUrl: updateDto.avatarUrl,
      bio: updateDto.bio,
    };

    const updated = await this.update(id, baseFields);

    let shouldSave = false;

    if (
      updateDto.status !== undefined &&
      updateDto.status !== updated.status
    ) {
      updated.status = updateDto.status === 1 ? 1 : 0;
      shouldSave = true;
    }

    if (updateDto.role && updateDto.role !== updated.role) {
      updated.role = updateDto.role;
      shouldSave = true;
    }

    if (shouldSave) {
      await this.userRepository.save(updated);
    }

    return updated;
  }
}
