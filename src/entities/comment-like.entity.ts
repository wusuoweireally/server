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
import { Comment } from './comment.entity';

/**
 * 用户评论点赞记录实体
 * 记录用户对评论的点赞操作
 */
@Entity('comment_likes')
@Unique(['userId', 'commentId']) // 确保同一用户对同一评论只能点赞一次
export class CommentLike {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '点赞记录ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', comment: '用户ID' })
  @Index('idx_comment_like_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'comment_id', type: 'bigint', comment: '评论ID' })
  @Index('idx_comment_like_comment_id')
  commentId: number;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @CreateDateColumn({
    name: 'created_at',
    comment: '点赞时间',
    type: 'datetime'
  })
  @Index('idx_comment_like_created_at')
  createdAt: Date;
}