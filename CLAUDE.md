# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 NestJS 的壁纸管理系统后端服务，提供完整的壁纸上传、管理和用户认证功能。

## 技术栈

- **NestJS v11** - 后端框架
- **TypeScript** - 编程语言
- **MySQL + TypeORM** - 数据库ORM
- **JWT + Cookie** - 认证系统（Cookie存储token）
- **Multer + Sharp** - 文件上传和图像处理
- **Class-validator** - DTO验证

## 开发命令

```bash
# 开发模式（NestJS内置）
npm run start:dev

# 开发模式（Nodemon）
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm run start:prod

# 运行测试
npm run test
```

## 核心架构

### 模块结构
- **UserModule** - 用户管理、认证、头像上传
- **WallpaperModule** - 壁纸核心功能（上传、搜索、管理）

### 认证系统
- JWT token存储在HTTP-only Cookie中
- CurrentUser装饰器获取认证用户信息
- 所有敏感操作需要JwtAuthGuard保护

### 文件处理
- **壁纸文件**: `/uploads/wallpapers/` 和 `/uploads/thumbnails/`
- **用户头像**: `/uploads/profile-pictures/`
- 支持多格式验证和自动缩略图生成

### 数据库实体
- User - 用户信息（密码哈希存储）
- Wallpaper - 壁纸元数据和文件信息
- Tag/WallpaperTag - 标签系统
- UserFavorite/UserLike - 用户交互记录

## API特性

- **RESTful设计** - 规范的资源操作
- **分页搜索** - 支持多条件筛选和排序
- **文件上传** - 多类型文件支持
- **权限控制** - 用户只能操作自己的内容
- **自动验证** - DTO数据验证和转换

## 重要配置

- 服务端口: 3000 (可通过环境变量PORT修改)
- 静态文件服务已配置，可通过 `/uploads/` 路径访问
- 数据库配置在 `src/config/database.config.ts`
- JWT密钥通过环境变量 `JWT_SECRET` 配置