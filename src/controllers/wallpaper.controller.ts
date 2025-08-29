import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { WallpaperService } from '../services/wallpaper.service';
import { UploadService } from '../services/upload.service';
import {
  CreateWallpaperDto,
  UpdateWallpaperDto,
  WallpaperQueryDto,
} from '../dto/wallpaper.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { TagService } from '../services/tag.service';
import { ViewHistoryService } from '../services/view-history.service';

interface CreateWallpaperData extends CreateWallpaperDto {
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  aspectRatio: number;
}

@Controller('wallpapers')
export class WallpaperController {
  constructor(
    private readonly wallpaperService: WallpaperService,
    private readonly uploadService: UploadService,
    private readonly tagService: TagService,
    private readonly viewHistoryService: ViewHistoryService,
  ) {}

  /**
   * 上传壁纸
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadWallpaper(
    @UploadedFile() file: Express.Multer.File,
    @Body() createWallpaperDto: CreateWallpaperDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    try {
      // 处理文件上传
      const fileInfo = await this.uploadService.processWallpaperUpload(
        file,
        user.userId,
      );
      console.log(createWallpaperDto);

      // 创建壁纸记录
      const createData: CreateWallpaperData = {
        ...createWallpaperDto,
        ...fileInfo,
      };

      const wallpaper = await this.wallpaperService.create(
        createData,
        user.userId,
      );

      // 处理标签关联
      if (createWallpaperDto.tags && createWallpaperDto.tags.length > 0) {
        await this.tagService.processWallpaperTags(
          wallpaper.id,
          createWallpaperDto.tags,
        );
      }

      return {
        success: true,
        message: '壁纸上传成功',
        data: wallpaper,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message || '上传失败');
      }
      throw new BadRequestException('上传失败');
    }
  }

  /**
   * 获取壁纸列表（支持搜索和筛选）
   */
  @Get()
  async getWallpapers(@Query() query: WallpaperQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      tags,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      aspectRatio,
      category,
    } = query;

    const result = await this.wallpaperService.findAll(
      Number(page),
      Number(limit),
      sortBy,
      sortOrder,
      tags,
      minWidth ? Number(minWidth) : undefined,
      maxWidth ? Number(maxWidth) : undefined,
      minHeight ? Number(minHeight) : undefined,
      maxHeight ? Number(maxHeight) : undefined,
      aspectRatio ? Number(aspectRatio) : undefined,
      category,
    );

    return {
      success: true,
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit)),
      },
    };
  }

  /**
   * 获取壁纸详情
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWallpaper(@Param('id') id: string, @Req() request: Request) {
    const wallpaper = await this.wallpaperService.findById(Number(id));

    // 增加查看次数
    await this.wallpaperService.incrementViewCount(Number(id));

    // 记录浏览历史（如果用户已登录）
    const userId = (request.user as { userId?: number })?.userId;
    if (userId) {
      await this.viewHistoryService.createViewHistory({
        userId,
        wallpaperId: Number(id),
      });
    }

    return {
      success: true,
      data: wallpaper,
    };
  }

  /**
   * 获取壁纸的标签
   */
  @Get(':id/tags')
  async getWallpaperTags(@Param('id') id: string) {
    // 验证壁纸是否存在
    await this.wallpaperService.findById(Number(id));

    const tags = await this.tagService.getTagsByWallpaperId(Number(id));

    return {
      success: true,
      data: tags,
    };
  }

  /**
   * 更新壁纸信息
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateWallpaper(
    @Param('id') id: string,
    @Body() updateData: UpdateWallpaperDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    // 验证用户权限
    const wallpaper = await this.wallpaperService.findById(Number(id));
    if (wallpaper.uploaderId !== user.userId) {
      throw new BadRequestException('无权修改此壁纸');
    }

    const updatedWallpaper = await this.wallpaperService.update(
      Number(id),
      updateData,
    );

    return {
      success: true,
      message: '壁纸更新成功',
      data: updatedWallpaper,
    };
  }

  /**
   * 删除壁纸
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteWallpaper(
    @Param('id') id: string,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    // 验证用户权限
    const wallpaper = await this.wallpaperService.findById(Number(id));
    if (wallpaper.uploaderId !== user.userId) {
      throw new BadRequestException('无权删除此壁纸');
    }

    await this.wallpaperService.delete(Number(id));

    // 删除相关文件
    await this.uploadService.deleteUploadedFiles(
      wallpaper.fileUrl,
      wallpaper.thumbnailUrl,
    );

    return {
      success: true,
      message: '壁纸删除成功',
    };
  }

  /**
   * 点赞壁纸
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeWallpaper(@Param('id') id: string) {
    await this.wallpaperService.incrementLikeCount(Number(id));

    return {
      success: true,
      message: '点赞成功',
    };
  }

  /**
   * 取消点赞壁纸
   */
  @Post(':id/unlike')
  @UseGuards(JwtAuthGuard)
  async unlikeWallpaper(@Param('id') id: string) {
    await this.wallpaperService.decrementLikeCount(Number(id));

    return {
      success: true,
      message: '取消点赞成功',
    };
  }

  /**
   * 收藏壁纸
   */
  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async favoriteWallpaper(@Param('id') id: string) {
    await this.wallpaperService.incrementFavoriteCount(Number(id));

    return {
      success: true,
      message: '收藏成功',
    };
  }

  /**
   * 取消收藏壁纸
   */
  @Post(':id/unfavorite')
  @UseGuards(JwtAuthGuard)
  async unfavoriteWallpaper(@Param('id') id: string) {
    await this.wallpaperService.decrementFavoriteCount(Number(id));

    return {
      success: true,
      message: '取消收藏成功',
    };
  }

  /**
   * 获取热门壁纸
   */
  @Get('popular')
  async getPopularWallpapers(@Query('limit') limit: string = '10') {
    const wallpapers = await this.wallpaperService.getPopularWallpapers(
      Number(limit),
    );

    return {
      success: true,
      data: wallpapers,
    };
  }

  /**
   * 根据上传者获取壁纸
   */
  @Get('uploader/:uploaderId')
  async getWallpapersByUploader(
    @Param('uploaderId') uploaderId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.wallpaperService.findByUploaderId(
      Number(uploaderId),
      Number(page),
      Number(limit),
    );

    return {
      success: true,
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit)),
      },
    };
  }
}
