import { Test, TestingModule } from '@nestjs/testing';
import { WallpaperController } from './wallpaper.controller';
import { WallpaperService } from './wallpaper.service';

describe('WallpaperController', () => {
  let controller: WallpaperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WallpaperController],
      providers: [WallpaperService],
    }).compile();

    controller = module.get<WallpaperController>(WallpaperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
