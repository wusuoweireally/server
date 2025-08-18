import { Injectable } from '@nestjs/common';
import { CreateWallpaperDto } from './dto/create-wallpaper.dto';
import { UpdateWallpaperDto } from './dto/update-wallpaper.dto';

@Injectable()
export class WallpaperService {
  create(createWallpaperDto: CreateWallpaperDto) {
    return 'This action adds a new wallpaper';
  }

  findAll() {
    return `This action returns all wallpaper`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wallpaper`;
  }

  update(id: number, updateWallpaperDto: UpdateWallpaperDto) {
    return `This action updates a #${id} wallpaper`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallpaper`;
  }
}
