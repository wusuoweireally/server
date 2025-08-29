import {
  Entity,
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
  @PrimaryColumn({ name: 'wallpaper_id', type: 'bigint', comment: '壁纸ID' })
  wallpaperId: number;

  @PrimaryColumn({ name: 'tag_id', type: 'int', comment: '标签ID' })
  @Index('idx_tag_id')
  tagId: number;

  @ManyToOne(() => Wallpaper, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallpaper_id' })
  wallpaper: Wallpaper;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
