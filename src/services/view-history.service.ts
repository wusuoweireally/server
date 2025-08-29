import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ViewHistory } from '../entities/view-history.entity';
import { CreateViewHistoryDto } from '../dto/view-history.dto';

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepository: Repository<ViewHistory>,
  ) {}

  /**
   * 创建浏览记录
   */
  async createViewHistory(
    createViewHistoryDto: CreateViewHistoryDto,
  ): Promise<ViewHistory> {
    const { userId, wallpaperId } = createViewHistoryDto;

    // 检查是否已存在相同的浏览记录（同一用户同一壁纸）
    const existingHistory = await this.viewHistoryRepository.findOne({
      where: { userId, wallpaperId },
      order: { viewedAt: 'DESC' },
    });

    // 如果存在记录，更新浏览时间
    if (existingHistory) {
      existingHistory.viewedAt = new Date();
      return await this.viewHistoryRepository.save(existingHistory);
    }

    // 创建新记录
    const viewHistory = this.viewHistoryRepository.create({
      userId,
      wallpaperId,
      viewedAt: new Date(),
    });

    return await this.viewHistoryRepository.save(viewHistory);
  }

  /**
   * 获取用户最近30天的浏览记录
   */
  async getUserViewHistory(userId: number): Promise<ViewHistory[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.viewHistoryRepository.find({
      where: {
        userId,
        viewedAt: LessThan(new Date()), // 确保不会包含未来的记录
      },
      relations: ['wallpaper', 'wallpaper.uploader'],
      order: { viewedAt: 'DESC' },
      take: 100, // 限制返回数量
    });
  }

  /**
   * 清理30天前的浏览记录
   */
  async cleanupOldViewHistory(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.viewHistoryRepository.delete({
      viewedAt: LessThan(thirtyDaysAgo),
    });
  }

  /**
   * 删除特定用户的浏览记录
   */
  async deleteUserViewHistory(userId: number): Promise<void> {
    await this.viewHistoryRepository.delete({ userId });
  }

  /**
   * 删除特定壁纸的浏览记录
   */
  async deleteWallpaperViewHistory(wallpaperId: number): Promise<void> {
    await this.viewHistoryRepository.delete({ wallpaperId });
  }
}
