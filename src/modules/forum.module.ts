import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { PostController } from '../controllers/post.controller';
import { CommentController } from '../controllers/comment.controller';
import { ReportController } from '../controllers/report.controller';
import { PostService } from '../services/post.service';
import { CommentService } from '../services/comment.service';
import { ReportService } from '../services/report.service';

/**
 * 论坛模块
 *
 * 负责处理论坛相关的所有功能，包括：
 * - 帖子的创建、查询、更新、删除
 * - 评论的创建、查询、删除
 * - 点赞功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,         // 帖子实体
      Comment,      // 评论实体
      PostLike,     // 帖子点赞实体
      CommentLike,  // 评论点赞实体
      Report,       // 举报实体
      User,         // 用户实体（用于关联查询）
    ]),
  ],
  controllers: [
    PostController,    // 帖子控制器
    CommentController, // 评论控制器
    ReportController,  // 举报控制器
  ],
  providers: [
    PostService,       // 帖子服务
    CommentService,    // 评论服务
    ReportService,     // 举报服务
  ],
  exports: [
    PostService,       // 导出帖子服务，供其他模块使用
    CommentService,    // 导出评论服务，供其他模块使用
    ReportService,     // 导出举报服务，供其他模块使用
  ],
})
export class ForumModule {}