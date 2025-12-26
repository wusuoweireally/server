import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';

@Entity('wallpapers')
export class Wallpaper {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '壁纸ID' })
  id: number;

  @Column({ name: 'file_url', length: 500, comment: '壁纸文件URL' })
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: ['general', 'anime', 'people'],
    default: 'general',
    comment: '分类: general-通用, anime-动画, people-人物',
  })
  @Index('idx_category')
  category: 'general' | 'anime' | 'people';

  @Column({ length: 255, nullable: true, comment: '壁纸标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '壁纸描述' })
  description: string;

  @Column({
    name: 'thumbnail_url',
    length: 500,
    nullable: true,
    comment: '缩略图URL',
  })
  thumbnailUrl: string;

  @Column({ name: 'file_size', type: 'bigint', comment: '文件大小(字节)' })
  fileSize: number;

  @Column({ length: 20, nullable: true, comment: '文件格式' })
  format: string;

  @Column({ type: 'int', comment: '图片宽度' })
  width: number;

  @Column({ type: 'int', comment: '图片高度' })
  height: number;

  @Column({
    name: 'aspect_ratio',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '宽高比',
  })
  @Index('idx_aspect_ratio')
  aspectRatio: number;

  @Column({ name: 'uploader_id', type: 'bigint', comment: '上传者ID' })
  @Index('idx_uploader_id')
  uploaderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'view_count', type: 'int', default: 0, comment: '浏览次数' })
  @Index('idx_view_count_desc')
  viewCount: number;

  @Column({ name: 'like_count', type: 'int', default: 0, comment: '点赞数' })
  @Index('idx_like_count')
  likeCount: number;

  @Column({
    name: 'favorite_count',
    type: 'int',
    default: 0,
    comment: '收藏数',
  })
  favoriteCount: number;

  @Column({ type: 'tinyint', default: 1, comment: '状态 0:未审核 1:已审核' })
  @Index('idx_status')
  status: number;

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
    comment: '是否推荐',
  })
  @Index('idx_is_featured')
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  @Index('idx_created_at_desc')
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 标签关联
  @ManyToMany(() => Tag, (tag) => tag.wallpapers)
  @JoinTable({
    name: 'wallpaper_tags',
    joinColumn: { name: 'wallpaper_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
