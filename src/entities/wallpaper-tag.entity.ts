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
import { Tag } from './tag.entity';

@Entity('wallpaper_tags')
export class WallpaperTag {
  @PrimaryColumn({ name: 'wallpaper_id', type: 'bigint' })
  wallpaperId: number;

  @PrimaryColumn({ name: 'tag_id', type: 'int' })
  tagId: number;

  @ManyToOne(() => Wallpaper, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallpaper_id' })
  wallpaper: Wallpaper;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index('idx_tag_id')
  // 索引将在@Column()中通过options定义
}