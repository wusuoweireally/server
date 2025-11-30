import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

export enum PostCategory {
  TECH_DISCUSSION = 'tech_discussion',
  EXPERIENCE_SHARING = 'experience_sharing',
  Q_A = 'q_a',
  RESOURCE_SHARING = 'resource_sharing',
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  MODERATED = 'moderated',
  HIDDEN = 'hidden',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '帖子ID' })
  id: number;

  @Column({ length: 255, comment: '帖子标题' })
  title: string;

  @Column({ type: 'text', comment: '帖子内容' })
  content: string;

  @Column({
    type: 'enum',
    enum: PostCategory,
    comment: '分类: tech_discussion-技术讨论, experience_sharing-经验分享, q_a-问答求助, resource_sharing-资源分享',
  })
  @Index('idx_category')
  category: PostCategory;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PUBLISHED,
    comment: '状态: draft-草稿, published-已发布, moderated-已审核, hidden-已隐藏',
  })
  @Index('idx_status')
  status: PostStatus;

  @Column({ name: 'author_id', type: 'bigint', comment: '作者ID' })
  @Index('idx_author_id')
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'view_count', type: 'int', default: 0, comment: '浏览次数' })
  @Index('idx_view_count_desc')
  viewCount: number;

  @Column({ name: 'like_count', type: 'int', default: 0, comment: '点赞数' })
  @Index('idx_like_count')
  likeCount: number;

  @Column({ name: 'comment_count', type: 'int', default: 0, comment: '评论数' })
  @Index('idx_comment_count')
  commentCount: number;

  @Column({ name: 'share_count', type: 'int', default: 0, comment: '分享数' })
  shareCount: number;

  @Column({ name: 'is_pinned', type: 'boolean', default: false, comment: '是否置顶' })
  @Index('idx_is_pinned')
  isPinned: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false, comment: '是否精华' })
  @Index('idx_is_featured')
  isFeatured: boolean;

  @Column({ name: 'last_comment_at', type: 'datetime', nullable: true, comment: '最后评论时间' })
  @Index('idx_last_comment_at')
  lastCommentAt: Date;

  @Column({ nullable: true, comment: '标签' })
  tags: string;

  @Column({ type: 'text', nullable: true, comment: '摘要' })
  summary: string;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true, comment: '缩略图URL' })
  thumbnailUrl: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  @Index('idx_created_at_desc')
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: true, comment: '元数据' })
  metadata: string;
}