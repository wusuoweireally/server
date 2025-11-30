import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

export enum ReportTargetType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  VIOLENCE = 'violence',
  COPYRIGHT = 'copyright',
  MISINFORMATION = 'misinformation',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '举报记录ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', comment: '举报人ID' })
  userId: number;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType, comment: '举报目标类型' })
  targetType: ReportTargetType;

  @Column({ name: 'target_id', type: 'bigint', comment: '举报目标ID' })
  targetId: number;

  @Column({ name: 'reason', type: 'enum', enum: ReportReason, comment: '举报原因' })
  reason: ReportReason;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '举报描述' })
  description: string;

  @Column({ name: 'status', type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING, comment: '处理状态' })
  status: ReportStatus;

  @Column({ name: 'reviewed_by', type: 'bigint', nullable: true, comment: '处理人ID' })
  reviewedBy: number;

  @Column({ name: 'review_note', type: 'text', nullable: true, comment: '处理说明' })
  reviewNote: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: '创建时间' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, { eager: false, nullable: true })
  @JoinColumn({ name: 'target_id', foreignKeyConstraintName: 'FK_report_target_post' })
  post: Post;

  @ManyToOne(() => Comment, { eager: false, nullable: true })
  @JoinColumn({ name: 'target_id', foreignKeyConstraintName: 'FK_report_target_comment' })
  comment: Comment;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;
}