import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Wallpaper } from '../entities/wallpaper.entity';
import { Tag } from '../entities/tag.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { UserLike } from '../entities/user-like.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Report } from '../entities/report.entity';

const isDevelopment = process.env.NODE_ENV === 'development';

// 数据库配置
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '12345678',
  database: 'wallpaper_site',
  entities: [
    User,
    Wallpaper,
    Tag,
    WallpaperTag,
    UserFavorite,
    UserLike,
    ViewHistory,
    Post,
    Comment,
    PostLike,
    CommentLike,
    Report,
  ],
  // 注意：开发环境使用 synchronize: true 方便快速开发
  // 生产环境必须关闭同步(synchronize: false)并使用迁移文件
  synchronize: true,
  logging: true,
  charset: 'utf8mb4',
  timezone: '+08:00',
};

/**
 * 数据库配置说明
 *
 * 当前配置（开发环境）：
 * - synchronize: true - 自动同步实体到数据库，适合快速开发
 * - 修改实体后重启服务即可生效
 *
 * 生产环境配置建议：
 * - synchronize: false - 必须关闭自动同步
 * - 使用迁移文件管理数据库结构变更
 * - 更安全，可追溯，团队协作更方便
 *
 * 迁移命令（在 server/ 目录下执行）：
 * 1. 生成迁移文件：npm run typeorm:generate -- src/migrations/DescriptiveName
 * 2. 执行迁移：    npm run typeorm:run
 * 3. 回滚迁移：    npm run typeorm:revert
 * 4. 查看状态：    npm run typeorm:show
 *
 * 生产环境部署步骤：
 * 1. 关闭 synchronize: false
 * 2. 运行 npm run typeorm:run 同步数据库
 * 3. 部署应用
 */
