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
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { WallpaperService } from '../services/wallpaper.service';
import { ViewHistoryService } from '../services/view-history.service';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { CurrentUserType } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly wallpaperService: WallpaperService,
    private readonly viewHistoryService: ViewHistoryService,
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
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60天（毫秒）
      path: '/', // 确保所有接口均可携带
    });

    return {
      success: true,
      message: '登录成功',
      data: {
        user: result.user,
        token: result.access_token,
      },
    };
  }

  // 用户退出登录
  @Post('logout')
  @UseGuards(OptionalJwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication', { path: '/' });
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

    // 验证用户ID的有效性
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException('用户未认证或认证信息无效');
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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

  // 更新用户信息
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('用户ID无效2');
    }

    // 仅允许本人或管理员修改
    if (currentUser.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权修改该用户信息');
    }

    const user = await this.userService.update(userId, updateUserDto);
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
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('用户ID无效3');
    }

    // 仅允许本人或管理员删除
    if (currentUser.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除该用户');
    }

    await this.userService.remove(userId);
    return {
      success: true,
      message: '删除成功',
    };
  }

  // 禁用/启用用户
  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id') id: string) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('用户ID无效4');
    }

    const user = await this.userService.toggleStatus(userId);
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
  @UseGuards(JwtAuthGuard)
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
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('用户ID无效6');
    }

    // 仅允许本人或管理员上传
    if (currentUser.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权上传该用户头像');
    }

    if (!file) {
      throw new BadRequestException('请选择要上传的头像文件');
    }

    const avatarUrl = `${file.filename}`;
    const updatedUser = await this.userService.updateAvatar(userId, avatarUrl);

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

  /**
   * 获取用户点赞的壁纸列表
   */
  @Get('likes')
  @UseGuards(JwtAuthGuard)
  async getUserLikes(
    @CurrentUser() user: { userId: number; username: string },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    console.log(user);
    console.log(page);
    console.log(limit);
    const result = await this.wallpaperService.getUserLikedWallpapers(
      user.userId,
      Number(page),
      Number(limit),
    );

    const { data, total } = result;
    const limitCount: number = Number(limit) || 20;
    const totalCount: number = typeof total === 'number' ? total : 0;
    const safeData = Array.isArray(data) ? data : [];

    return {
      success: true,
      data: safeData,
      pagination: {
        page: Number(page),
        limit: limitCount,
        total: totalCount,
        pages: Math.ceil(totalCount / limitCount),
      },
    };
  }

  /**
   * 获取用户收藏的壁纸列表
   */
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  async getUserFavorites(
    @CurrentUser() user: { userId: number; username: string },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.wallpaperService.getUserFavoritedWallpapers(
      user.userId,
      Number(page),
      Number(limit),
    );

    const { data, total } = result;
    const limitCount: number = Number(limit) || 20;
    const totalCount: number = typeof total === 'number' ? total : 0;
    const safeData = Array.isArray(data) ? data : [];

    return {
      success: true,
      data: safeData,
      pagination: {
        page: Number(page),
        limit: limitCount,
        total: totalCount,
        pages: Math.ceil(totalCount / limitCount),
      },
    };
  }

  /**
   * 获取用户浏览记录
   */
  @Get('view-history')
  @UseGuards(JwtAuthGuard)
  async getUserViewHistory(
    @CurrentUser() user: { userId: number; username: string },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.viewHistoryService.getUserViewHistory(
      user.userId,
      Number(page),
      Number(limit),
    );

    const { data, total } = result;
    const limitCount: number = Number(limit) || 20;
    const totalCount: number = typeof total === 'number' ? total : 0;
    const safeData = Array.isArray(data) ? data : [];

    return {
      success: true,
      data: safeData,
      pagination: {
        page: Number(page),
        limit: limitCount,
        total: totalCount,
        pages: Math.ceil(totalCount / limitCount),
      },
    };
  }
  /**
   * 获取当前用户上传的壁纸列表
   */
  @Get('wallpapers')
  @UseGuards(JwtAuthGuard)
  async getUserWallpapers(
    @CurrentUser() user: { userId: number; username: string },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    console.log(user);
    const result = await this.wallpaperService.findByUploaderId(
      user.userId,
      Number(page),
      Number(limit),
    );

    const { data, total } = result;
    const limitCount: number = Number(limit) || 20;
    const totalCount: number = typeof total === 'number' ? total : 0;
    const safeData = Array.isArray(data) ? data : [];

    return {
      success: true,
      data: safeData,
      pagination: {
        page: Number(page),
        limit: limitCount,
        total: totalCount,
        pages: Math.ceil(totalCount / limitCount),
      },
    };
  }
  // 根据ID查询用户
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    // 转换并验证ID
    const userId = Number(id);
    console.log(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('用户ID无效 fava');
    }

    const user = await this.userService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }
}
