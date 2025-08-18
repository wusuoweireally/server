import { TypeOrmModuleOptions } from '@nestjs/typeorm';
const isDevelopment = process.env.NODE_ENV === 'development';
// 数据库配置
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '12345678',
  database: 'wallpaper_site',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: isDevelopment, // 开发环境可以使用，生产环境建议关闭
  logging: isDevelopment,
  charset: 'utf8mb4',
  timezone: '+08:00',
};
