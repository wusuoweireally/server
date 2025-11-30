import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
  UpdateUserStatusDto,
} from '../../dto/admin.dto';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async list(@Query() query: AdminUserQueryDto) {
    const { page = 1, limit = 20 } = query;
    const result = await this.userService.adminQueryUsers(query);

    const users = result.data.map(({ passwordHash, ...rest }) => rest);

    return {
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit)),
      },
    };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return {
      success: true,
      data: rest,
    };
  }

  @Post()
  async create(@Body() dto: AdminCreateUserDto) {
    const user = await this.userService.create(
      dto,
      dto.role ?? UserRole.USER,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user as any;
    return {
      success: true,
      message: '创建用户成功',
      data: rest,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    const user = await this.userService.adminUpdateUser(id, dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return {
      success: true,
      message: '更新用户信息成功',
      data: rest,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const user = await this.userService.setStatus(id, dto.status);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return {
      success: true,
      message: dto.status === 1 ? '用户已启用' : '用户已禁用',
      data: rest,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
    return {
      success: true,
      message: '用户已删除',
    };
  }
}
