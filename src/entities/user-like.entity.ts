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

@Entity('user_likes')
export class UserLike {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'wallpaper_id', type: 'bigint' })
  wallpaperId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Wallpaper, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallpaper_id' })
  wallpaper: Wallpaper;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index('uk_user_wallpaper', { unique: true })
  // 唯一索引将通过装饰器定义

  @Index('idx_user_id')
  // 索引将在@Column()中通过options定义

  @Index('idx_wallpaper_id')
  // 索引将在@Column()中通过options定义

  @Index('idx_created_at')
  // 索引将在@CreateDateColumn中自动创建
}