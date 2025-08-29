import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Wallpaper } from './wallpaper.entity';

@Entity('view_history')
export class ViewHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '浏览记录ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', comment: '用户ID' })
  @Index('idx_user_id')
  userId: number;

  @Column({ name: 'wallpaper_id', type: 'bigint', comment: '壁纸ID' })
  @Index('idx_wallpaper_id')
  wallpaperId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Wallpaper, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallpaper_id' })
  wallpaper: Wallpaper;

  @CreateDateColumn({ name: 'viewed_at', comment: '浏览时间' })
  @Index('idx_viewed_at')
  viewedAt: Date;
}
