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
  Req,
  UnauthorizedException,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // 用户注册（仅支持JSON格式，不支持头像上传）
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);

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

    // 设置Cookie，有效期60天（与JWT token过期时间一致）
    response.cookie('Authentication', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60天（毫秒）
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
  async getProfile(@Req() request: Request) {
    // 从JWT token中获取用户ID
    const userId = (request.user as { userId?: number })?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户未认证');
    }

    const user = await this.userService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }

  // 查询所有用户（分页）

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('username') username?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    let result: { users: User[]; total: number };
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
    const users = result.users.map((user: User) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

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
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number) {
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
    @Param('id') id: number,
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
  async remove(@Param('id') id: number) {
    await this.userService.remove(id);
    return {
      success: true,
      message: '删除成功',
    };
  }

  // 禁用/启用用户
  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  async toggleStatus(@Param('id') id: number) {
    const user = await this.userService.toggleStatus(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      message: user.status === 1 ? '用户已启用' : '用户已禁用',
      data: result,
    };
  }

  // 上传头像（管理功能，推荐在注册时上传头像）
  @Post(':id/avatar')
  //   @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req, file, cb) => {
          const userId = req.params.id;
          const uniqueSuffix = Date.now();
          const fileExt = extname(file.originalname);
          cb(null, `user_${userId}_${uniqueSuffix}${fileExt}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new BadRequestException('只允许上传图片文件!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB限制
    }),
  )
  async uploadAvatar(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的头像文件');
    }

    const avatarUrl = `${file.filename}`;
    const updatedUser = await this.userService.updateAvatar(id, avatarUrl);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = updatedUser;

    return {
      success: true,
      message: '头像上传成功',
      data: {
        avatarUrl,
        user: result,
      },
    };
  }
}
