import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index('uk_slug')
  // 唯一索引已经在@Column({ unique: true })中定义

  @Index('idx_sort_order')
  // 索引将在@Column()中通过options定义

  @Index('idx_is_active')
  // 索引将在@Column()中通过options定义
}