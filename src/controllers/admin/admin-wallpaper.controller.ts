import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { WallpaperService } from '../../services/wallpaper.service';
import { AdminUpdateWallpaperDto, AdminWallpaperQueryDto, AdminUpdateWallpaperTagsDto } from '../../dto/admin.dto';

@Controller('admin/wallpapers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminWallpaperController {
  constructor(private readonly wallpaperService: WallpaperService) {}

  @Get()
  async list(@Query() query: AdminWallpaperQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const { data, total } = await this.wallpaperService.adminQueryWallpapers(
      page,
      limit,
      {
        search: query.search,
        category: query.category,
        status:
          query.status !== undefined ? Number(query.status) : undefined,
        uploaderId:
          query.uploaderId !== undefined ? Number(query.uploaderId) : undefined,
      },
    );

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    const wallpaper = await this.wallpaperService.findById(id);
    return {
      success: true,
      data: wallpaper,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateWallpaperDto,
  ) {
    const wallpaper = await this.wallpaperService.update(id, dto);
    return {
      success: true,
      message: '壁纸信息已更新',
      data: wallpaper,
    };
  }

  @Patch(':id/tags')
  async updateTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateWallpaperTagsDto,
  ) {
    const tags =
      await this.wallpaperService.updateWallpaperTags(id, dto.tags || []);
    return {
      success: true,
      message: '标签已更新',
      data: tags,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.wallpaperService.delete(id);
    return {
      success: true,
      message: '壁纸已删除',
    };
  }
}
