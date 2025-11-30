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
import { CreatePostDto, PostListQueryDto, UpdatePostDto } from '../dto/post.dto';
import { LimitQueryDto, PaginationQueryDto } from '../dto/pagination.dto';
import { PostService } from '../services/post.service';

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
 * 帖子控制器
 *
 * 处理论坛帖子相关的HTTP请求，包括：
 * - 帖子的CRUD操作
 * - 帖子列表查询和搜索（公开访问）
 * - 点赞功能（需要登录）
 * - 用户帖子管理（需要登录）
 */
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * 创建新帖子
   *
   * @param createPostDto 帖子创建数据
   * @param user 当前登录用户
   * @returns 创建的帖子信息
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Body(bodyValidationPipe) createPostDto: CreatePostDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const post = await this.postService.create(createPostDto, user.userId);
      return {
        success: true,
        message: '帖子创建成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '帖子创建失败',
      };
    }
  }

  /**
   * 获取帖子列表（支持分页、搜索、筛选）
   *
   * @param query 查询参数
   * @returns 帖子列表和分页信息
   */
  @Get()
  async getPosts(@Query(queryValidationPipe) query: PostListQueryDto) {
    try {
      const result = await this.postService.findAll(query);

      return {
        success: true,
        message: '获取帖子列表成功',
        data: result.data,
        pagination: buildPaginationMeta(result),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取帖子列表失败',
      };
    }
  }

  /**
   * 获取单个帖子详情
   *
   * @param id 帖子ID
   * @returns 帖子详情
   */
  @Get(':id')
  async getPost(@Param('id', ParseIntPipe) id: number) {
    try {
      const post = await this.postService.findById(id);
      return {
        success: true,
        message: '获取帖子成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取帖子失败',
      };
    }
  }

  /**
   * 更新帖子
   *
   * @param id 帖子ID
   * @param updatePostDto 更新数据
   * @param user 当前登录用户
   * @returns 更新后的帖子信息
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body(bodyValidationPipe) updatePostDto: UpdatePostDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const post = await this.postService.update(id, updatePostDto, user.userId);
      return {
        success: true,
        message: '帖子更新成功',
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '帖子更新失败',
      };
    }
  }

  /**
   * 删除帖子
   *
   * @param id 帖子ID
   * @param user 当前登录用户
   * @returns 操作结果
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      await this.postService.delete(id, user.userId);
      return {
        success: true,
        message: '帖子删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '帖子删除失败',
      };
    }
  }

  /**
   * 点赞帖子
   *
   * @param id 帖子ID
   * @param user 当前登录用户
   * @returns 操作结果
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      await this.postService.incrementLikeCount(id, user.userId);
      return {
        success: true,
        message: '点赞成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '点赞失败',
      };
    }
  }

  /**
   * 取消点赞帖子
   *
   * @param id 帖子ID
   * @param user 当前登录用户
   * @returns 操作结果
   */
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      await this.postService.decrementLikeCount(id, user.userId);
      return {
        success: true,
        message: '取消点赞成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '取消点赞失败',
      };
    }
  }

  /**
   * 检查是否已点赞
   *
   * @param id 帖子ID
   * @param user 当前登录用户
   * @returns 点赞状态
   */
  @Get(':id/like')
  @UseGuards(JwtAuthGuard)
  async checkLikeStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const hasLiked = await this.postService.hasLiked(id, user.userId);
      return {
        success: true,
        message: '获取点赞状态成功',
        data: { hasLiked },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取点赞状态失败',
      };
    }
  }

  /**
   * 获取热门帖子
   *
   * @param query 查询参数
   * @returns 热门帖子列表
   */
  @Get('popular/list')
  async getPopularPosts(@Query(queryValidationPipe) query: LimitQueryDto) {
    try {
      const posts = await this.postService.getPopularPosts(query.limit);

      return {
        success: true,
        message: '获取热门帖子成功',
        data: posts,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取热门帖子失败',
      };
    }
  }

  /**
   * 获取最新帖子
   *
   * @param query 查询参数
   * @returns 最新帖子列表
   */
  @Get('latest/list')
  async getLatestPosts(@Query(queryValidationPipe) query: LimitQueryDto) {
    try {
      const posts = await this.postService.getLatestPosts(query.limit);

      return {
        success: true,
        message: '获取最新帖子成功',
        data: posts,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取最新帖子失败',
      };
    }
  }

  /**
   * 获取当前用户的帖子
   *
   * @param query 查询参数
   * @param user 当前登录用户
   * @returns 用户帖子列表
   */
  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(
    @Query(queryValidationPipe) query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    try {
      const result = await this.postService.getUserPosts(
        user.userId,
        query.page,
        query.limit,
      );

      return {
        success: true,
        message: '获取用户帖子成功',
        data: result.data,
        pagination: buildPaginationMeta(result),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取用户帖子失败',
      };
    }
  }
}
