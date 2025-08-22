import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('bigint')
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    name: 'avatar_url',
    length: 500,
    nullable: true,
    default: 'defaultAvatar.webp',
  })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'tinyint', default: 1, comment: '1:正常 0:禁用' })
  status: number;
}
