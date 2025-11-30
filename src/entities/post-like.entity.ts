import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

/**
 * 用户帖子点赞记录实体
 * 记录用户对帖子的点赞操作
 */
@Entity('post_likes')
@Unique(['userId', 'postId']) // 确保同一用户对同一帖子只能点赞一次
export class PostLike {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '点赞记录ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', comment: '用户ID' })
  @Index('idx_post_like_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'post_id', type: 'bigint', comment: '帖子ID' })
  @Index('idx_post_like_post_id')
  postId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn({
    name: 'created_at',
    comment: '点赞时间',
    type: 'datetime'
  })
  @Index('idx_post_like_created_at')
  createdAt: Date;
}