import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WallpaperService } from './wallpaper.service';
import { CreateWallpaperDto } from './dto/create-wallpaper.dto';
import { UpdateWallpaperDto } from './dto/update-wallpaper.dto';

@Controller('wallpaper')
export class WallpaperController {
  constructor(private readonly wallpaperService: WallpaperService) {}

  @Post()
  create(@Body() createWallpaperDto: CreateWallpaperDto) {
    return this.wallpaperService.create(createWallpaperDto);
  }

  @Get()
  findAll() {
    return this.wallpaperService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wallpaperService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWallpaperDto: UpdateWallpaperDto) {
    return this.wallpaperService.update(+id, updateWallpaperDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wallpaperService.remove(+id);
  }
}
