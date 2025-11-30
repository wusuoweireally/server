import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallpaper } from '../entities/wallpaper.entity';
import { Tag } from '../entities/tag.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { UserLike } from '../entities/user-like.entity';
import { ViewHistory } from '../entities/view-history.entity';

// TypeORM DataSource 配置
// 用于 CLI 工具（迁移生成和执行）
export const AppDataSource = new DataSource({
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
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  charset: 'utf8mb4',
  timezone: '+08:00',
});

/**
 * 数据迁移配置说明
 *
 * 此配置文件用于 TypeORM CLI 工具
 *
 * 常用命令：
 * 1. 生成迁移文件（基于实体变更）：
 *    npx typeorm migration:generate src/migrations/DescriptiveName -d src/config/data-source.ts
 *
 * 2. 创建空迁移文件：
 *    npx typeorm migration:create src/migrations/DescriptiveName
 *
 * 3. 执行待处理的迁移：
 *    npx typeorm migration:run -d src/config/data-source.ts
 *
 * 4. 回滚最后一次迁移：
 *    npx typeorm migration:revert -d src/config/data-source.ts
 *
 * 5. 查看迁移状态：
 *    npx typeorm migration:show -d src/config/data-source.ts
 *
 * 迁移最佳实践：
 * - 迁移文件名使用描述性名称，如: AddUserAvatarColumn
 * - 每个迁移只做一个逻辑变更
 * - 在开发环境测试迁移后再部署到生产
 * - 备份生产数据库后再执行迁移
 */
