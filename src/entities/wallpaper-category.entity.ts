import {
  Entity,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Wallpaper } from './wallpaper.entity';
import { Category } from './category.entity';

@Entity('wallpaper_categories')
export class WallpaperCategory {
  @PrimaryColumn({ name: 'wallpaper_id', type: 'bigint' })
  wallpaperId: number;

  @PrimaryColumn({ name: 'category_id', type: 'int' })
  categoryId: number;

  @ManyToOne(() => Wallpaper, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallpaper_id' })
  wallpaper: Wallpaper;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index('idx_category_id')
  // 索引将在@Column()中通过options定义
}