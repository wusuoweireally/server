import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../common/pagination';
import { CreatePostDto, PostListQueryDto, UpdatePostDto } from '../dto/post.dto';
import { Post, PostStatus } from '../entities/post.entity';
import { PostLike } from '../entities/post-like.entity';

/**
 * 帖子服务
 *
 * 处理论坛帖子的所有业务逻辑，包括：
 * - 帖子的创建、查询、更新、删除
 * - 帖子统计数据的更新
 * - 用户点赞功能
 * - 帖子搜索和分页
 */
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
  ) {}

  private buildPublishedPostQuery(): SelectQueryBuilder<Post> {
    return this.postRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .leftJoinAndSelect('post.author', 'author');
  }

  private serializeTags(tags?: string[]): string | undefined {
    if (!tags || tags.length === 0) {
      return undefined;
    }

    const normalized = tags
      .map(tag => tag.trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized.join(',') : undefined;
  }

  /**
   * 创建新帖子
   *
   * @param postData 帖子数据
   * @param authorId 作者ID
   * @returns 创建的帖子
   */
  async create(postData: CreatePostDto, authorId: number): Promise<Post> {
    const { tags, ...rest } = postData;

    const post = this.postRepository.create({
      ...rest,
      tags: this.serializeTags(tags),
      authorId,
      status: PostStatus.PUBLISHED, // 默认发布状态
    });

    return await this.postRepository.save(post);
  }

  /**
   * 根据ID查找帖子（包含作者信息）
   *
   * @param id 帖子ID
   * @param incrementView 是否增加浏览量
   * @returns 帖子信息
   */
  async findById(id: number, incrementView = true): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, status: PostStatus.PUBLISHED },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在或未发布`);
    }

    // 增加浏览量
    if (incrementView) {
      await this.incrementViewCount(id);
    }

    return post;
  }

  /**
   * 分页查询帖子列表（支持搜索和多种筛选）
   *
   * @param params 查询参数
   * @returns 分页结果
   */
  async findAll(params: PostListQueryDto): Promise<PaginatedResult<Post>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      category,
      search,
      authorId,
      tags,
    } = params;

    const skip = (page - 1) * limit;
    const tagsFilter = tags ?? [];

    // 构建查询条件
    const queryBuilder = this.buildPublishedPostQuery();

    // 添加搜索条件
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search OR post.summary LIKE :search)',
        { search: searchTerm },
      );
    }

    // 添加分类筛选
    if (category) {
      queryBuilder.andWhere('post.category = :category', { category });
    }

    // 添加作者筛选
    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    // 添加标签筛选
    if (tagsFilter.length > 0) {
      tagsFilter.forEach((tag, index) => {
        const paramName = `tag${index}`;
        queryBuilder.andWhere(
          `post.tags IS NOT NULL AND FIND_IN_SET(:${paramName}, post.tags) > 0`,
        );
        queryBuilder.setParameter(paramName, tag);
      });
    }

    // 处理排序逻辑
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'viewCount',
      'likeCount',
      'commentCount',
      'popular',
    ];

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    if (sortField === 'popular') {
      queryBuilder
        .orderBy('post.viewCount', 'DESC')
        .addOrderBy('post.likeCount', 'DESC');
    } else {
      queryBuilder.orderBy(`post.${sortField}`, sortOrder);
    }

    // 执行分页查询
    const [posts, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: posts, total, page, limit };
  }

  /**
   * 更新帖子信息
   *
   * @param id 帖子ID
   * @param updateData 更新数据
   * @param userId 当前用户ID
   * @returns 更新后的帖子
   */
  async update(
    id: number,
    updateData: UpdatePostDto,
    userId: number,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('只能编辑自己的帖子');
    }

    const { tags, ...rest } = updateData;

    await this.postRepository.update(id, {
      ...rest,
      ...(tags ? { tags: this.serializeTags(tags) } : {}),
    });
    return await this.findById(id, false);
  }

  /**
   * 删除帖子
   *
   * @param id 帖子ID
   * @param userId 当前用户ID
   */
  async delete(id: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('只能删除自己的帖子');
    }

    // 删除相关的点赞记录
    await this.postLikeRepository.delete({ postId: id });

    // 删除帖子
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`帖子 ID ${id} 删除失败`);
    }
  }

  /**
   * 增加浏览次数
   *
   * @param id 帖子ID
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.postRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 检查用户是否已点赞
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async hasLiked(postId: number, userId: number): Promise<boolean> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /**
   * 增加点赞次数（同时创建用户点赞记录）
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   */
  async incrementLikeCount(postId: number, userId: number): Promise<void> {
    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!existingLike) {
      const postLike = this.postLikeRepository.create({
        postId,
        userId,
      });
      await this.postLikeRepository.save(postLike);
      await this.postRepository.increment({ id: postId }, 'likeCount', 1);
    }
  }

  /**
   * 减少点赞次数（同时删除用户点赞记录）
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   */
  async decrementLikeCount(postId: number, userId: number): Promise<void> {
    const result = await this.postLikeRepository.delete({
      postId,
      userId,
    });

    if (result.affected && result.affected > 0) {
      await this.postRepository.decrement({ id: postId }, 'likeCount', 1);
    }
  }

  /**
   * 获取热门帖子
   *
   * @param limit 限制数量
   * @returns 热门帖子列表
   */
  async getPopularPosts(limit: number = 10): Promise<Post[]> {
    return await this.buildPublishedPostQuery()
      .orderBy('post.viewCount', 'DESC')
      .addOrderBy('post.likeCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取最新帖子
   *
   * @param limit 限制数量
   * @returns 最新帖子列表
   */
  async getLatestPosts(limit: number = 10): Promise<Post[]> {
    return await this.buildPublishedPostQuery()
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取用户发布的帖子
   *
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserPosts(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      where: { authorId: userId, status: PostStatus.PUBLISHED },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data: posts, total, page, limit };
  }
}
