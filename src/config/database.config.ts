import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Wallpaper } from '../entities/wallpaper.entity';
import { Tag } from '../entities/tag.entity';
import { WallpaperTag } from '../entities/wallpaper-tag.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { UserLike } from '../entities/user-like.entity';
import { ViewHistory } from '../entities/view-history.entity';

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
  ],
  synchronize: true, // 开发环境可以使用，生产环境建议关闭
  logging: true,
  charset: 'utf8mb4',
  timezone: '+08:00',
};
