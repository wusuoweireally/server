import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { CreateTagDto } from '../dto/tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(WallpaperTag)
    private wallpaperTagRepository: Repository<WallpaperTag>,
  ) {}

  /**
   * 搜索标签
   * @param keyword 搜索关键词
   * @param limit 返回数量限制
   */
  async searchTags(keyword?: string, limit: number = 10): Promise<Tag[]> {
    const queryBuilder = this.tagRepository.createQueryBuilder('tag');

    if (keyword) {
      queryBuilder.where('tag.name LIKE :keyword', { keyword: `%${keyword}%` });
    }

    queryBuilder.orderBy('tag.usageCount', 'DESC').take(limit);

    return queryBuilder.getMany();
  }

  /**
   * 创建新标签
   * @param createTagDto 创建标签数据
   */
  async createTag(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;

    // 检查标签是否已存在
    const existingTag = await this.tagRepository.findOne({
      where: { name },
    });

    if (existingTag) {
      return existingTag;
    }

    // 生成slug（将名称转换为小写，空格替换为连字符）
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const tag = this.tagRepository.create({
      name,
      slug,
      usageCount: 0,
    });

    return this.tagRepository.save(tag);
  }

  /**
   * 根据壁纸ID获取关联标签
   * @param wallpaperId 壁纸ID
   */
  async getTagsByWallpaperId(wallpaperId: number): Promise<Tag[]> {
    const wallpaperTags = await this.wallpaperTagRepository.find({
      where: { wallpaperId },
      relations: ['tag'],
    });

    return wallpaperTags.map((wt) => wt.tag);
  }

  /**
   * 根据ID获取标签
   * @param id 标签ID
   */
  async getTagById(id: number): Promise<Tag | null> {
    return this.tagRepository.findOne({ where: { id } });
  }

  /**
   * 增加标签使用次数
   * @param tagId 标签ID
   */

  async incrementUsageCount(tagId: number): Promise<void> {
    await this.tagRepository.increment({ id: tagId }, 'usageCount', 1);
  }

  /**
   * 减少标签使用次数
   * @param tagId 标签ID
   */
  async decrementUsageCount(tagId: number): Promise<void> {
    await this.tagRepository.decrement({ id: tagId }, 'usageCount', 1);
  }

  /**
   * @param wallpaperId 壁纸ID
   * @param tagNames 标签名称数组
   */
  async processWallpaperTags(
    wallpaperId: number,
    tagNames: string[],
  ): Promise<void> {
    if (!tagNames || tagNames.length === 0) return;

    // 创建或获取标签
    const tags: Tag[] = [];
    for (const tagName of tagNames) {
      const tag = await this.createTag({ name: tagName });
      tags.push(tag);
    }

    // 创建壁纸标签关联
    for (const tag of tags) {
      const existingAssociation = await this.wallpaperTagRepository.findOne({
        where: { wallpaperId, tagId: tag.id },
      });

      if (!existingAssociation) {
        const wallpaperTag = this.wallpaperTagRepository.create({
          wallpaperId,
          tagId: tag.id,
        });
        await this.wallpaperTagRepository.save(wallpaperTag);

        // 增加标签使用次数
        await this.incrementUsageCount(tag.id);
      }
    }
  }
}
