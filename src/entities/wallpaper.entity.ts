import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('wallpapers')
export class Wallpaper {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ name: 'aspect_ratio', type: 'decimal', precision: 5, scale: 2, nullable: true })
  aspectRatio: number;

  @Column({ length: 10 })
  format: string;

  @Column({ name: 'uploader_id', type: 'bigint' })
  uploaderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount: number;

  @Column({ name: 'favorite_count', type: 'int', default: 0 })
  favoriteCount: number;

  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index('idx_uploader_id')
  // 索引将在@Column()中通过options定义

  @Index('idx_status')
  // 索引将在@Column()中通过options定义

  @Index('idx_is_featured')
  // 索引将在@Column()中通过options定义

  @Index('idx_created_at')
  // 索引将在@CreateDateColumn中自动创建

  @Index('idx_like_count')
  // 索引将在@Column()中通过options定义

  @Index('idx_format')
  // 索引将在@Column()中通过options定义

  @Index('idx_aspect_ratio')
  // 索引将在@Column()中通过options定义
}