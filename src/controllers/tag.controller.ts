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
import { TagService } from '../services/tag.service';
import { CreateTagDto, SearchTagsDto, UpdateTagDto } from '../dto/tag.dto';
import { Tag } from '../entities/tag.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * 获取标签列表（支持搜索 + 分页）
   */
  @Get()
  async getTags(
    @Query() query: SearchTagsDto,
  ): Promise<{
    success: boolean;
    data: Tag[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const result = await this.tagService.getTagsWithPagination(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * 创建新标签
   * @param createTagDto 创建标签数据
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTag(
    @Body() createTagDto: CreateTagDto,
  ): Promise<{ success: boolean; data: Tag }> {
    const tag = await this.tagService.createTag(createTagDto);
    return {
      success: true,
      data: tag,
    };
  }

  /**
   * 根据ID获取标签详情
   * @param id 标签ID
   */
  @Get(':id')
  async getTagById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; data: Tag | null }> {
    const tag = await this.tagService.getTagById(id);
    return {
      success: true,
      data: tag,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const tag = await this.tagService.updateTag(id, updateTagDto.name);
    return {
      success: true,
      message: '标签已更新',
      data: tag,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteTag(@Param('id', ParseIntPipe) id: number) {
    await this.tagService.deleteTag(id);
    return {
      success: true,
      message: '标签已删除',
    };
  }
}
