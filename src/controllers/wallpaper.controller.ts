import { Controller, Get } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('papers')
export class WallpaperController {
  constructor(private readonly httpService: HttpService) {}

  @Get('random')
  async getRandomWallpaper() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.52vmy.cn/api/img/tu/girl'),
      );

      return {
        code: response.data.code,
        msg: response.data.msg,
        url: response.data.url,
      };
    } catch (error) {
      return {
        code: 500,
        msg: '获取壁纸失败',
        url: null,
      };
    }
  }
}
