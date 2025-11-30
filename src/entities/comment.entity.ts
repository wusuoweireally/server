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
import { Post } from './post.entity';
import { CommentLike } from './comment-like.entity';

/**
 * 评论实体
 *
 * 处理论坛评论的数据结构，支持：
 * - 层级回复（父子评论关系）
 * - 评论内容和管理
 * - 作者关联和统计信息
 */
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '评论ID' })
  id: number;

  @Column({ type: 'text', comment: '评论内容' })
  content: string;

  @Column({ name: 'post_id', type: 'bigint', comment: '帖子ID' })
  @Index('idx_comment_post_id')
  postId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'author_id', type: 'bigint', comment: '作者ID' })
  @Index('idx_comment_author_id')
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'parent_id', type: 'bigint', nullable: true, comment: '父评论ID' })
  @Index('idx_comment_parent_id')
  parentId: number;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  children: Comment[];

  @OneToMany(() => CommentLike, like => like.comment)
  likes: CommentLike[];

  @Column({ name: 'like_count', type: 'int', default: 0, comment: '点赞数' })
  @Index('idx_comment_like_count')
  likeCount: number;

  @Column({ name: 'reply_count', type: 'int', default: 0, comment: '回复数' })
  @Index('idx_comment_reply_count')
  replyCount: number;

  @Column({ nullable: true, comment: '状态' })
  status: string;

  @Column({ nullable: true, comment: '元数据' })
  metadata: string;

  @CreateDateColumn({
    name: 'created_at',
    comment: '创建时间',
    type: 'datetime'
  })
  @Index('idx_comment_created_at')
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: '更新时间',
    type: 'datetime'
  })
  @Index('idx_comment_updated_at')
  updatedAt: Date;
}