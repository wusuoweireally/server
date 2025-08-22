import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index('uk_slug')
  // 唯一索引已经在@Column({ unique: true })中定义

  @Index('idx_usage_count')
  // 索引将在@Column()中通过options定义
}