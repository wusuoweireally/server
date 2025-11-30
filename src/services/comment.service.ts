import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginatedResult } from '../common/pagination';
import { CommentQueryDto, CreateCommentDto } from '../dto/comment.dto';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { CommentLike } from '../entities/comment-like.entity';

/**
 * 评论服务
 *
 * 处理论坛评论的所有业务逻辑，包括：
 * - 评论的创建、查询、删除
 * - 帖子评论数的更新
 * - 评论的层级关系管理
 * - 用户评论权限控制
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
  ) {}

  /**
   * 创建新评论
   *
   * @param commentData 评论数据
   * @param authorId 作者ID
   * @returns 创建的评论
   */
  async create(commentData: CreateCommentDto, authorId: number): Promise<Comment> {
    // 验证帖子是否存在
    const post = await this.postRepository.findOne({
      where: { id: commentData.postId },
    });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${commentData.postId} 不存在`);
    }

    // 如果是回复评论，验证父评论是否存在
    if (commentData.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: commentData.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`父评论 ID ${commentData.parentId} 不存在`);
      }

      // 确保父评论属于同一帖子
      if (parentComment.postId !== commentData.postId) {
        throw new ForbiddenException('父评论不属于指定帖子');
      }
    }

    const comment = this.commentRepository.create({
      content: commentData.content,
      parentId: commentData.parentId,
      postId: commentData.postId,
      authorId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // 更新帖子评论数 & 最后评论时间
    await this.postRepository.increment(
      { id: commentData.postId },
      'commentCount',
      1,
    );
    await this.postRepository.update(commentData.postId, {
      lastCommentAt: new Date(),
    });

    // 更新父评论回复数
    if (commentData.parentId) {
      await this.commentRepository.increment(
        { id: commentData.parentId },
        'replyCount',
        1,
      );
    }

    return this.findById(savedComment.id);
  }

  /**
   * 根据ID查找评论（包含作者信息）
   *
   * @param id 评论ID
   * @returns 评论信息
   */
  async findById(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    return comment;
  }

  /**
   * 获取帖子的评论列表（支持分页和层级显示）
   *
   * @param postId 帖子ID
   * @param params 查询参数
   * @returns 分页结果
   */
  async findByPostId(
    postId: number,
    params: CommentQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'ASC', // 评论默认按时间升序排列
      parentId,
    } = params;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.postId = :postId', { postId });

    // 如果指定了父评论ID，获取该评论的子评论
    if (parentId !== undefined) {
      queryBuilder.andWhere('comment.parentId = :parentId', { parentId });
    } else {
      // 否则获取顶级评论
      queryBuilder.andWhere('comment.parentId IS NULL');
    }

    // 添加作者信息关联
    queryBuilder.leftJoinAndSelect('comment.author', 'author');

    // 处理排序
    const validSortFields = ['createdAt', 'updatedAt', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`comment.${sortField}`, sortOrder);

    // 执行分页查询
    const [comments, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: comments, total, page, limit };
  }

  /**
   * 获取评论的所有子评论
   *
   * @param parentCommentId 父评论ID
   * @returns 子评论列表
   */
  async getChildComments(parentCommentId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { parentId: parentCommentId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 删除评论
   *
   * @param id 评论ID
   * @param userId 当前用户ID
   */
  async delete(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    // 递归删除子评论
    await this.deleteChildComments(id);

    // 删除评论
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`评论 ID ${id} 删除失败`);
    }

    // 更新帖子评论数
    await this.postRepository.decrement(
      { id: comment.postId },
      'commentCount',
      1,
    );

    if (comment.parentId) {
      await this.commentRepository.decrement(
        { id: comment.parentId },
        'replyCount',
        1,
      );
    }
  }

  /**
   * 递归删除子评论
   *
   * @param parentCommentId 父评论ID
   */
  private async deleteChildComments(parentCommentId: number): Promise<void> {
    const childComments = await this.commentRepository.find({
      where: { parentId: parentCommentId },
    });

    for (const child of childComments) {
      // 递归删除子评论的子评论
      await this.deleteChildComments(child.id);

      // 删除子评论
      await this.commentRepository.delete(child.id);

      // 更新帖子评论数
      await this.postRepository.decrement(
        { id: child.postId },
        'commentCount',
        1,
      );
    }
  }

  /**
   * 更新评论内容
   *
   * @param id 评论ID
   * @param content 新内容
   * @param userId 当前用户ID
   * @returns 更新后的评论
   */
  async update(
    id: number,
    content: string,
    userId: number,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('只能编辑自己的评论');
    }

    await this.commentRepository.update(id, { content });
    return await this.findById(id);
  }

  /**
   * 获取用户发布的评论
   *
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserComments(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { authorId: userId },
      relations: ['author', 'post'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data: comments, total, page, limit };
  }

  /**
   * 获取帖子的评论总数统计
   *
   * @param postId 帖子ID
   * @returns 评论统计信息
   */
  async getCommentStats(postId: number): Promise<{
    totalComments: number;
    topLevelComments: number;
  }> {
    // 获取总评论数
    const totalComments = await this.commentRepository.count({
      where: { postId },
    });

    // 获取顶级评论数
    const topLevelComments = await this.commentRepository.count({
      where: { postId, parentId: IsNull() },
    });

    return {
      totalComments,
      topLevelComments,
    };
  }

  /**
   * 检查评论是否存在
   *
   * @param id 评论ID
   * @returns 是否存在
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.commentRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 获取最新评论
   *
   * @param limit 限制数量
   * @returns 最新评论列表
   */
  async getLatestComments(limit: number = 10): Promise<Comment[]> {
    return await this.commentRepository.find({
      relations: ['author', 'post'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 点赞评论
   *
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 点赞结果和当前点赞状态
   */
  async likeComment(commentId: number, userId: number): Promise<{
    isLiked: boolean;
    likeCount: number;
  }> {
    // 验证评论是否存在
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${commentId} 不存在`);
    }

    // 检查是否已经点赞
    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      // 已经点赞，执行取消点赞
      await this.commentLikeRepository.delete(existingLike.id);

      // 减少点赞数
      await this.commentRepository.decrement({ id: commentId }, 'likeCount', 1);

      // 获取更新后的点赞数
      const updatedComment = await this.commentRepository.findOne({
        where: { id: commentId },
      });

      return {
        isLiked: false,
        likeCount: updatedComment?.likeCount || 0,
      };
    } else {
      // 执行点赞
      const like = this.commentLikeRepository.create({
        commentId,
        userId,
      });
      await this.commentLikeRepository.save(like);

      // 增加点赞数
      await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);

      // 获取更新后的点赞数
      const updatedComment = await this.commentRepository.findOne({
        where: { id: commentId },
      });

      return {
        isLiked: true,
        likeCount: updatedComment?.likeCount || 0,
      };
    }
  }

  /**
   * 检查用户是否对评论点赞
   *
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 是否点赞
   */
  async isCommentLikedByUser(commentId: number, userId: number): Promise<boolean> {
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });
    return !!like;
  }

  /**
   * 获取用户点赞的评论列表
   *
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserLikedComments(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    const skip = (page - 1) * limit;

    const [commentLikes, total] = await this.commentLikeRepository.findAndCount({
      where: { userId },
      relations: ['comment', 'comment.author', 'comment.post'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const comments = commentLikes.map(like => like.comment);

    return { data: comments, total, page, limit };
  }

  /**
   * 获取评论点赞统计
   *
   * @param commentId 评论ID
   * @returns 点赞统计信息
   */
  async getCommentLikeStats(commentId: number): Promise<{
    likeCount: number;
    isLikedByCurrentUser?: boolean;
  }> {
    // 获取评论点赞数
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${commentId} 不存在`);
    }

    return {
      likeCount: comment.likeCount,
    };
  }
}
