import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildPaginationMeta } from '../common/pagination';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { CurrentUserType } from '../decorators/current-user.decorator';
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto/comment.dto';
import { LimitQueryDto, PaginationQueryDto } from '../dto/pagination.dto';
import { CommentService } from '../services/comment.service';

const bodyValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

const queryValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

/**
 * 评论控制器
 *
 * 处理论坛评论相关的HTTP请求，包括：
 * - 评论的CRUD操作（需要登录）
 * - 评论列表查询（公开访问）
 * - 评论层级关系管理（公开访问）
 * - 用户评论管理（需要登录）
 */
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 创建新评论
   *
   * @param createCommentDto 评论创建数据
   * @param user 当前登录用户
   * @returns 创建的评论信息
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body(bodyValidationPipe) createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const comment = await this.commentService.create(createCommentDto, user.userId);
      return {
        success: true,
        message: '评论创建成功',
        data: comment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '评论创建失败',
      };
    }
  }

  /**
   * 获取单个评论详情
   *
   * @param id 评论ID
   * @returns 评论详情
   */
  @Get(':id')
  async getComment(@Param('id', ParseIntPipe) id: number) {
    try {
      const comment = await this.commentService.findById(id);
      return {
        success: true,
        message: '获取评论成功',
        data: comment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取评论失败',
      };
    }
  }

  /**
   * 获取帖子的评论列表
   *
   * @param postId 帖子ID
   * @param query 查询参数
   * @returns 评论列表和分页信息
   */
  @Get('post/:postId')
  async getPostComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query(queryValidationPipe) query: CommentQueryDto,
  ) {
    try {
      const result = await this.commentService.findByPostId(postId, query);

      return {
        success: true,
        message: '获取评论列表成功',
        data: result.data,
        pagination: buildPaginationMeta(result),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取评论列表失败',
      };
    }
  }

  /**
   * 获取评论的子评论
   *
   * @param parentCommentId 父评论ID
   * @returns 子评论列表
   */
  @Get(':parentCommentId/replies')
  async getCommentReplies(
    @Param('parentCommentId', ParseIntPipe) parentCommentId: number,
  ) {
    try {
      const replies = await this.commentService.getChildComments(parentCommentId);
      return {
        success: true,
        message: '获取回复列表成功',
        data: replies,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取回复列表失败',
      };
    }
  }

  /**
   * 更新评论内容
   *
   * @param id 评论ID
   * @param updateCommentDto 更新数据
   * @param user 当前登录用户
   * @returns 更新后的评论信息
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body(bodyValidationPipe) updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const comment = await this.commentService.update(
        id,
        updateCommentDto.content,
        user.userId,
      );
      return {
        success: true,
        message: '评论更新成功',
        data: comment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '评论更新失败',
      };
    }
  }

  /**
   * 删除评论
   *
   * @param id 评论ID
   * @param user 当前登录用户
   * @returns 操作结果
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      await this.commentService.delete(id, user.userId);
      return {
        success: true,
        message: '评论删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '评论删除失败',
      };
    }
  }

  /**
   * 获取帖子的评论统计信息
   *
   * @param postId 帖子ID
   * @returns 评论统计信息
   */
  @Get('stats/:postId')
  async getCommentStats(@Param('postId', ParseIntPipe) postId: number) {
    try {
      const stats = await this.commentService.getCommentStats(postId);
      return {
        success: true,
        message: '获取评论统计成功',
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取评论统计失败',
      };
    }
  }

  /**
   * 获取当前用户的评论
   *
   * @param query 查询参数
   * @param user 当前登录用户
   * @returns 用户评论列表
   */
  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  async getMyComments(
    @Query(queryValidationPipe) query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const result = await this.commentService.getUserComments(
        user.userId,
        query.page,
        query.limit,
      );

      return {
        success: true,
        message: '获取用户评论成功',
        data: result.data,
        pagination: buildPaginationMeta(result),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取用户评论失败',
      };
    }
  }

  /**
   * 获取最新评论
   *
   * @param query 查询参数
   * @returns 最新评论列表
   */
  @Get('latest/list')
  async getLatestComments(@Query(queryValidationPipe) query: LimitQueryDto) {
    try {
      const comments = await this.commentService.getLatestComments(query.limit);

      return {
        success: true,
        message: '获取最新评论成功',
        data: comments,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取最新评论失败',
      };
    }
  }

  /**
   * 点赞/取消点赞评论
   *
   * @param id 评论ID
   * @param user 当前登录用户
   * @returns 点赞结果
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const result = await this.commentService.likeComment(id, user.userId);
      return {
        success: true,
        message: result.isLiked ? '评论点赞成功' : '取消点赞成功',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '评论点赞操作失败',
      };
    }
  }

  /**
   * 检查用户是否对评论点赞
   *
   * @param id 评论ID
   * @param user 当前登录用户
   * @returns 点赞状态
   */
  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  async getCommentLikeStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const isLiked = await this.commentService.isCommentLikedByUser(id, user.userId);
      const stats = await this.commentService.getCommentLikeStats(id);

      return {
        success: true,
        message: '获取点赞状态成功',
        data: {
          isLiked,
          likeCount: stats.likeCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取点赞状态失败',
      };
    }
  }

  /**
   * 获取用户点赞的评论列表
   *
   * @param query 查询参数
   * @param user 当前登录用户
   * @returns 用户点赞的评论列表
   */
  @Get('user/liked')
  @UseGuards(JwtAuthGuard)
  async getMyLikedComments(
    @Query(queryValidationPipe) query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const result = await this.commentService.getUserLikedComments(
        user.userId,
        query.page,
        query.limit,
      );

      return {
        success: true,
        message: '获取用户点赞评论成功',
        data: result.data,
        pagination: buildPaginationMeta(result),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取用户点赞评论失败',
      };
    }
  }
}
