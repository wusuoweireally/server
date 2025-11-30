import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryColumn('bigint', { comment: '用户ID' })
  id: number;

  @Column({ length: 50, unique: true, comment: '用户名' })
  username: string;

  @Column({ length: 100, unique: true, nullable: true, comment: '邮箱地址' })
  email: string;

  @Column({ name: 'password_hash', length: 255, comment: '密码哈希值' })
  passwordHash: string;

  @Column({
    name: 'avatar_url',
    length: 500,
    nullable: true,
    default: 'defaultAvatar.png',
    comment: '头像URL',
  })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true, comment: '个人简介' })
  bio: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @Column({ type: 'tinyint', default: 1, comment: '用户状态 1:正常 0:禁用' })
  status: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: '用户角色',
  })
  role: UserRole;
}
