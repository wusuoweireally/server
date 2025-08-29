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

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '收藏ID' })
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

  @Index('uk_user_wallpaper', ['userId', 'wallpaperId'], { unique: true })
  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  @Index('idx_created_at')
  createdAt: Date;
}
