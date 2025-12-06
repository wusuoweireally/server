import { Injectable, NotFoundException } from '@nestjs/common';
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

  private generateSlug(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

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
    const normalizedName = name.trim();
    const slug = this.generateSlug(normalizedName);

    // 检查标签是否已存在
    const existingTag = await this.tagRepository.findOne({
      where: { slug },
    });

    if (existingTag) {
      return existingTag;
    }

    const tag = this.tagRepository.create({
      name: normalizedName,
      slug,
      usageCount: 0,
    });

    return this.tagRepository.save(tag);
  }

  /**
   * 获取标签分页列表
   */
  async getTagsWithPagination(query: {
    page?: number;
    limit?: number;
    keyword?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: Tag[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      keyword,
      sortBy = 'usageCount',
      sortOrder = 'DESC',
    } = query;

    const qb = this.tagRepository.createQueryBuilder('tag');

    if (keyword && keyword.trim()) {
      qb.where('(tag.name LIKE :keyword OR tag.slug LIKE :keyword)', {
        keyword: `%${keyword.trim()}%`,
      });
    }

    const validSort = ['usageCount', 'name', 'createdAt'];
    const orderField = validSort.includes(sortBy) ? sortBy : 'usageCount';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);

    const [data, total] = await qb
      .orderBy(`tag.${orderField}`, orderDirection)
      .skip((currentPage - 1) * take)
      .take(take)
      .getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      limit: take,
    };
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

  async updateTag(id: number, name: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const normalizedName = name.trim();
    tag.name = normalizedName;
    tag.slug = this.generateSlug(normalizedName);

    return this.tagRepository.save(tag);
  }

  async deleteTag(id: number): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    await this.tagRepository.delete(id);
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

  /**
   * 替换指定壁纸的标签
   */
  async replaceWallpaperTags(
    wallpaperId: number,
    tagNames: string[],
  ): Promise<Tag[]> {
    const uniqueNames = Array.from(
      new Set(
        (tagNames || [])
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      ),
    );

    const currentTags = await this.wallpaperTagRepository.find({
      where: { wallpaperId },
      relations: ['tag'],
    });

    if (currentTags.length > 0) {
      await this.wallpaperTagRepository.delete({ wallpaperId });
      for (const relation of currentTags) {
        if (relation.tag && relation.tag.usageCount > 0) {
          await this.decrementUsageCount(relation.tagId);
        }
      }
    }

    if (uniqueNames.length === 0) {
      return [];
    }

    const tags: Tag[] = [];
    for (const name of uniqueNames) {
      const tag = await this.createTag({ name });
      tags.push(tag);
      await this.wallpaperTagRepository.save(
        this.wallpaperTagRepository.create({
          wallpaperId,
          tagId: tag.id,
        }),
      );
      await this.incrementUsageCount(tag.id);
    }

    return tags;
  }
}
