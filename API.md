# 用户管理 API 文档

## 概述

本API提供了完整的用户管理功能，包括注册、登录、查询、更新、删除等操作。使用Cookie进行身份验证，登录状态保持180天。

## 基础URL

```
http://localhost:3000/api/users
```

## 接口列表

### 1. 用户注册

**POST** `/api/users/register`

注册新用户，用户ID由前端提供且必须唯一。

**请求体：**

```json
{
  "id": "123456789", // 必填，数字字符串，用户自定义ID
  "username": "可选用户名", // 可选，不提供时自动生成
  "email": "user@example.com", // 可选，邮箱
  "password": "password123", // 必填，6-20位
  "avatarUrl": "头像URL" // 可选
}
```

**响应：**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": "123456789",
    "username": "快乐的用户1234",
    "email": "user@example.com",
    "avatarUrl": null,
    "status": 1,
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:00:00.000Z"
  }
}
```

### 2. 用户登录

**POST** `/api/users/login`

用户登录，成功后设置Cookie。

**请求体：**

```json
{
  "id": "123456789",
  "password": "password123"
}
```

**响应：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "id": "123456789",
    "username": "快乐的用户1234",
    "email": "user@example.com",
    "avatarUrl": null,
    "status": 1,
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:00:00.000Z"
  }
}
```

**Cookie:** `Authentication` cookie会被自动设置，有效期180天。

### 3. 用户退出

**POST** `/api/users/logout`

用户退出登录，清除Cookie。需要登录状态。

**响应：**

```json
{
  "success": true,
  "message": "退出登录成功"
}
```

### 4. 获取当前用户信息

**GET** `/api/users/profile?id=123456789`

获取指定用户的详细信息。需要登录状态。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "username": "快乐的用户1234",
    "email": "user@example.com",
    "avatarUrl": null,
    "status": 1,
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:00:00.000Z"
  }
}
```

### 5. 查询所有用户（分页）

**GET** `/api/users?page=1&limit=10&username=搜索关键词`

查询用户列表，支持分页和按用户名搜索。

**查询参数：**

- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `username`: 用户名搜索关键词（可选）

**响应：**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "123456789",
        "username": "快乐的用户1234",
        "email": "user@example.com",
        "avatarUrl": null,
        "status": 1,
        "createdAt": "2025-08-18T10:00:00.000Z",
        "updatedAt": "2025-08-18T10:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 6. 根据ID查询用户

**GET** `/api/users/:id`

根据用户ID查询单个用户信息。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "username": "快乐的用户1234",
    "email": "user@example.com",
    "avatarUrl": null,
    "status": 1,
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:00:00.000Z"
  }
}
```

### 7. 更新用户信息

**PATCH** `/api/users/:id`

更新用户信息。需要登录状态。

**请求体：**

```json
{
  "username": "新用户名", // 可选
  "email": "new@example.com", // 可选
  "password": "newpassword", // 可选
  "avatarUrl": "新头像URL" // 可选
}
```

**响应：**

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "123456789",
    "username": "新用户名",
    "email": "new@example.com",
    "avatarUrl": "新头像URL",
    "status": 1,
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:05:00.000Z"
  }
}
```

### 8. 删除用户

**DELETE** `/api/users/:id`

删除指定用户。需要登录状态。

**响应：**

```json
{
  "success": true,
  "message": "删除成功"
}
```

### 9. 禁用/启用用户

**PATCH** `/api/users/:id/toggle-status`

切换用户状态（启用/禁用）。需要登录状态。

**响应：**

```json
{
  "success": true,
  "message": "用户已禁用", // 或 "用户已启用"
  "data": {
    "id": "123456789",
    "username": "快乐的用户1234",
    "email": "user@example.com",
    "avatarUrl": null,
    "status": 0, // 0:禁用, 1:正常
    "createdAt": "2025-08-18T10:00:00.000Z",
    "updatedAt": "2025-08-18T10:10:00.000Z"
  }
}
```

## 错误响应

所有接口在出错时都会返回类似的错误格式：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

常见错误码：

- `400`: 请求参数错误
- `401`: 未授权（未登录或token过期）
- `404`: 用户不存在
- `409`: 冲突（用户ID、用户名或邮箱已存在）

## 身份验证

- 登录成功后，服务器会设置名为 `Authentication` 的HttpOnly Cookie
- Cookie有效期为180天
- 需要身份验证的接口会自动从Cookie中读取token
- 前端无需手动处理token，浏览器会自动携带Cookie

## 数据库表结构

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 COMMENT '1:正常 0:禁用'
);
```
