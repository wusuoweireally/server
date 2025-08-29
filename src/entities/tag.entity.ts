import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int', comment: '标签ID' })
  id: number;

  @Column({ length: 50, unique: true, comment: '标签名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '标签别名' })
  @Index('uk_slug')
  slug: string;

  @Column({ name: 'usage_count', type: 'int', default: 0, comment: '使用次数' })
  @Index('idx_usage_count')
  usageCount: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
