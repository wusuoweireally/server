import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallpaper } from '../entities/wallpaper.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { CreateWallpaperDto } from '../dto/wallpaper.dto';
import { TagService } from './tag.service';

@Injectable()
export class WallpaperService {
  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    private tagService: TagService,
  ) {}

  /**
   * 创建新壁纸
   */
  async create(
    createWallpaperDto: CreateWallpaperDto & {
      fileUrl: string;
      thumbnailUrl?: string;
      fileSize: number;
      width: number;
      height: number;
      format: string;
      aspectRatio: number;
    },
    uploaderId: number,
  ): Promise<Wallpaper> {
    const wallpaper = this.wallpaperRepository.create({
      ...createWallpaperDto,
      uploaderId,
    });

    await this.wallpaperRepository.save(wallpaper);
    return wallpaper;
  }

  /**
   * 根据ID查找壁纸
   */
  async findById(id: number): Promise<Wallpaper> {
    const wallpaper = await this.wallpaperRepository.findOne({
      where: { id },
      relations: ['uploader'],
    });

    if (!wallpaper) {
      throw new NotFoundException(`壁纸 ID ${id} 不存在`);
    }

    return wallpaper;
  }

  /**
   * 分页查询壁纸列表
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    tags?: string[],
    minWidth?: number,
    maxWidth?: number,
    minHeight?: number,
    maxHeight?: number,
    aspectRatio?: number,
    category?: 'general' | 'anime' | 'people',
  ): Promise<{ data: Wallpaper[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: { status: number; category?: string } = { status: 1 };

    if (category) {
      where.category = category;
    }

    // 构建查询条件
    const queryBuilder = this.wallpaperRepository
      .createQueryBuilder('wallpaper')
      .where('wallpaper.status = :status', { status: 1 });

    // 添加分类筛选
    if (category) {
      queryBuilder.andWhere('wallpaper.category = :category', { category });
    }

    // 添加尺寸筛选
    if (minWidth) {
      queryBuilder.andWhere('wallpaper.width >= :minWidth', { minWidth });
    }
    if (maxWidth) {
      queryBuilder.andWhere('wallpaper.width <= :maxWidth', { maxWidth });
    }
    if (minHeight) {
      queryBuilder.andWhere('wallpaper.height >= :minHeight', { minHeight });
    }
    if (maxHeight) {
      queryBuilder.andWhere('wallpaper.height <= :maxHeight', { maxHeight });
    }

    // 添加宽高比筛选
    if (aspectRatio) {
      queryBuilder.andWhere('wallpaper.aspectRatio = :aspectRatio', {
        aspectRatio,
      });
    }

    // 添加标签筛选
    if (tags && tags.length > 0) {
      queryBuilder
        .innerJoin('wallpaper_tags', 'wt', 'wallpaper.id = wt.wallpaper_id')
        .innerJoin('tags', 't', 'wt.tag_id = t.id')
        .andWhere('t.name IN (:...tags)', { tags });
    }

    // 添加排序
    const validSortFields = [
      'createdAt',
      'viewCount',
      'likeCount',
      'favoriteCount',
      'width',
      'height',
      'aspectRatio',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`wallpaper.${sortField}`, sortOrder);

    // 执行分页查询
    const [data, total] = await queryBuilder
      .leftJoinAndSelect('wallpaper.uploader', 'uploader')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * 更新壁纸信息
   */
  async update(id: number, updateData: Partial<Wallpaper>): Promise<Wallpaper> {
    await this.wallpaperRepository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * 删除壁纸（包含标签关联清理和标签使用次数更新）
   */
  async delete(id: number): Promise<void> {
    // 1. 查询壁纸的所有关联标签（使用TagService）
    const tags = await this.tagService.getTagsByWallpaperId(id);

    // 2. 删除壁纸标签关联记录
    await this.wallpaperRepository
      .createQueryBuilder()
      .delete()
      .from(WallpaperTag)
      .where('wallpaperId = :wallpaperId', { wallpaperId: id })
      .execute();

    // 3. 删除壁纸记录
    const result = await this.wallpaperRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`壁纸 ID ${id} 不存在`);
    }

    // 4. 更新标签使用次数（减少）
    for (const tag of tags) {
      if (tag.usageCount > 0) {
        await this.wallpaperRepository.decrement(
          { id: tag.id },
          'usageCount',
          1,
        );
      }
    }
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 增加点赞次数
   */
  async incrementLikeCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id }, 'likeCount', 1);
  }

  /**
   * 减少点赞次数
   */
  async decrementLikeCount(id: number): Promise<void> {
    await this.wallpaperRepository.decrement({ id }, 'likeCount', 1);
  }

  /**
   * 增加收藏次数
   */
  async incrementFavoriteCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id }, 'favoriteCount', 1);
  }

  /**
   * 减少收藏次数
   */
  async decrementFavoriteCount(id: number): Promise<void> {
    await this.wallpaperRepository.decrement({ id }, 'favoriteCount', 1);
  }

  /**
   * 根据上传者ID查询壁纸
   */
  async findByUploaderId(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.wallpaperRepository.findAndCount({
      where: { uploaderId, status: 1 },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  /**
   * 获取热门壁纸
   */
  async getPopularWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    return await this.wallpaperRepository.find({
      where: { status: 1 },
      relations: ['uploader'],
      order: { likeCount: 'DESC', viewCount: 'DESC' },
      take: limit,
    });
  }
}
