import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TagService } from '../services/tag.service';
import { CreateTagDto, SearchTagsDto } from '../dto/tag.dto';
import { Tag } from '../entities/tag.entity';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * 获取标签列表（支持搜索）
   * @param query 搜索参数
   */
  @Get()
  async getTags(
    @Query() query: SearchTagsDto,
  ): Promise<{ success: boolean; data: Tag[] }> {
    const tags = await this.tagService.searchTags(query.keyword);
    return {
      success: true,
      data: tags,
    };
  }

  /**
   * 创建新标签
   * @param createTagDto 创建标签数据
   */
  @Post()
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

  /**
   * 根据壁纸ID获取关联标签
   * @param id 壁纸ID
   */
}
