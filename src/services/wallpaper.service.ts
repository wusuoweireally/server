import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallpaper } from '../entities/wallpaper.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { UserLike } from '../entities/user-like.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { CreateWallpaperDto } from '../dto/wallpaper.dto';
import { TagService } from './tag.service';

@Injectable()
export class WallpaperService {
  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(UserLike)
    private readonly userLikeRepository: Repository<UserLike>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
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
   * 检查用户是否已点赞
   */
  async hasLiked(wallpaperId: number, userId: number): Promise<boolean> {
    const like = await this.userLikeRepository.findOne({
      where: { wallpaperId, userId },
    });
    return !!like;
  }

  /**
   * 增加点赞次数（同时创建用户点赞记录）
   */
  async incrementLikeCount(userId: number, wallpaperId: number): Promise<void> {
    // 检查是否已点赞
    const existingLike = await this.userLikeRepository.findOne({
      where: { userId, wallpaperId },
    });

    // 如果未点赞，创建点赞记录并增加计数
    if (!existingLike) {
      const userLike = this.userLikeRepository.create({
        userId,
        wallpaperId,
      });
      await this.userLikeRepository.save(userLike);
      await this.wallpaperRepository.increment(
        { id: wallpaperId },
        'likeCount',
        1,
      );
    }
  }

  /**
   * 减少点赞次数（同时删除用户点赞记录）
   */
  async decrementLikeCount(userId: number, wallpaperId: number): Promise<void> {
    // 查找并删除点赞记录
    const result = await this.userLikeRepository.delete({
      userId,
      wallpaperId,
    });

    // 如果删除成功，减少计数
    if (result.affected && result.affected > 0) {
      await this.wallpaperRepository.decrement(
        { id: wallpaperId },
        'likeCount',
        1,
      );
    }
  }

  /**
   * 检查用户是否已收藏
   */
  async hasFavorited(wallpaperId: number, userId: number): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { wallpaperId, userId },
    });
    return !!favorite;
  }

  /**
   * 增加收藏次数（同时创建用户收藏记录）
   */
  async incrementFavoriteCount(
    userId: number,
    wallpaperId: number,
  ): Promise<void> {
    // 检查是否已收藏
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { userId, wallpaperId },
    });

    // 如果未收藏，创建收藏记录并增加计数
    if (!existingFavorite) {
      const userFavorite = this.userFavoriteRepository.create({
        userId,
        wallpaperId,
      });
      await this.userFavoriteRepository.save(userFavorite);
      await this.wallpaperRepository.increment(
        { id: wallpaperId },
        'favoriteCount',
        1,
      );
    }
  }

  /**
   * 减少收藏次数（同时删除用户收藏记录）
   */
  async decrementFavoriteCount(
    userId: number,
    wallpaperId: number,
  ): Promise<void> {
    // 查找并删除收藏记录
    const result = await this.userFavoriteRepository.delete({
      userId,
      wallpaperId,
    });

    // 如果删除成功，减少计数
    if (result.affected && result.affected > 0) {
      await this.wallpaperRepository.decrement(
        { id: wallpaperId },
        'favoriteCount',
        1,
      );
    }
  }

  /**
   * 根据上传者ID查询壁纸
   */
  async findByUploaderId(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    // 验证上传者ID的有效性
    if (!uploaderId || isNaN(uploaderId) || uploaderId <= 0) {
      throw new NotFoundException('上传者ID无效');
    }

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

  /**
   * 获取用户点赞的壁纸列表（分页）
   */
  async getUserLikedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    const skip = (page - 1) * limit;

    const [likes, total] = await this.userLikeRepository.findAndCount({
      where: { userId },
      relations: ['wallpaper', 'wallpaper.uploader'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const wallpapers = likes
      .map((like) => like.wallpaper)
      .filter((wallpaper) => wallpaper && wallpaper.status === 1);

    return { data: wallpapers, total };
  }

  /**
   * 获取用户收藏的壁纸列表（分页）
   */
  async getUserFavoritedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.userFavoriteRepository.findAndCount({
      where: { userId },
      relations: ['wallpaper', 'wallpaper.uploader'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const wallpapers = favorites
      .map((favorite) => favorite.wallpaper)
      .filter((wallpaper) => wallpaper && wallpaper.status === 1);

    return { data: wallpapers, total };
  }
}
