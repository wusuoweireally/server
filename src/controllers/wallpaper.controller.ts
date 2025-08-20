import { Controller, Get, Res, Header, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';

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
    } catch {
      return {
        code: 500,
        msg: '获取壁纸失败',
        url: null,
        proxyUrl: null,
      };
    }
  }
}
