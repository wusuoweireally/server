import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  UnauthorizedException,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // 用户注册
  @Post('register')
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // 返回时不包含密码哈希
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      message: '注册成功',
      data: result,
    };
  }

  // 用户登录
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.id,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('用户ID或密码错误');
    }

    const result = this.authService.login(user);

    // 设置Cookie，有效期180天
    response.cookie('Authentication', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180天（毫秒）
    });

    return {
      success: true,
      message: '登录成功',
      data: result.user,
    };
  }

  // 用户退出登录
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication');
    return {
      success: true,
      message: '退出登录成功',
    };
  }

  // 获取当前用户信息
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Query('id') id: string) {
    const user = await this.userService.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }

  // 查询所有用户（分页）
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('username') username?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let result;
    if (username) {
      result = await this.userService.findByUsername(
        username,
        pageNum,
        limitNum,
      );
    } else {
      result = await this.userService.findAll(pageNum, limitNum);
    }

    // 移除密码哈希
    const users = result.users.map(
      (user: { [x: string]: any; passwordHash: any }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    );

    return {
      success: true,
      data: {
        users,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  // 根据ID查询用户
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }

  // 更新用户信息
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      message: '更新成功',
      data: result,
    };
  }

  // 删除用户
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      success: true,
      message: '删除成功',
    };
  }

  // 禁用/启用用户
  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  async toggleStatus(@Param('id') id: string) {
    const user = await this.userService.toggleStatus(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      message: user.status === 1 ? '用户已启用' : '用户已禁用',
      data: result,
    };
  }
}
