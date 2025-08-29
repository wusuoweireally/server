import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService {
  /**
   * 处理壁纸文件上传
   * @param file 上传的文件
   * @param uploaderId 上传者ID
   * @returns 壁纸信息对象
   */
  async processWallpaperUpload(
    file: Express.Multer.File,
    uploaderId: number,
  ): Promise<{
    fileUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    width: number;
    height: number;
    format: string;
    aspectRatio: number;
  }> {
    try {
      // 验证文件类型
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          '不支持的文件类型，仅支持 JPG、PNG、WebP、GIF 格式',
        );
      }

      // 验证文件大小 (最大50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('文件大小不能超过50MB');
      }

      // 生成文件名 (日期+用户ID)
      const fileExtension = path.extname(file.originalname);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${timestamp}__${uploaderId}${fileExtension}`;
      const thumbnailName = `${timestamp}__${uploaderId}_thumbnail.webp`;

      // 创建上传目
      const uploadDir = path.join(process.cwd(), 'uploads');
      const thumbnailsDir = path.join(uploadDir, 'thumbnails');
      const fileDir = path.join(uploadDir, 'wallpapers');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.mkdir(thumbnailsDir, { recursive: true });

      // 保存原始文件
      const filePath = path.join(fileDir, fileName);
      await fs.writeFile(filePath, file.buffer);

      // 使用 Sharp 获取图片信息
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      // 计算宽高比
      const aspectRatio =
        metadata.width && metadata.height
          ? Number((metadata.width / metadata.height).toFixed(2))
          : 0;

      // 生成缩略图 (300px宽，保持比例)
      const thumbnailBuffer = await image
        .resize(300, null, { fit: 'inside' })
        .webp({ quality: 100 })
        .toBuffer();

      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);

      return {
        fileUrl: `/uploads/wallpapers/${fileName}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
        fileSize: file.size,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || '',
        aspectRatio,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('文件处理失败');
    }
  }

  /**
   * 删除上传的文件
   */
  async deleteUploadedFiles(
    fileUrl: string,
    thumbnailUrl: string,
  ): Promise<void> {
    try {
      if (fileUrl) {
        const filePath = path.join(process.cwd(), fileUrl);
        await fs.unlink(filePath).catch(() => {});
      }

      if (thumbnailUrl) {
        const thumbnailPath = path.join(process.cwd(), thumbnailUrl);
        await fs.unlink(thumbnailPath).catch(() => {});
      }
    } catch (error) {
      // 文件删除失败不影响主要逻辑
      console.error('删除文件失败:', error);
    }
  }
}
