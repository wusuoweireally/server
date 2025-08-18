import { PartialType } from '@nestjs/mapped-types';
import { CreateWallpaperDto } from './create-wallpaper.dto';

export class UpdateWallpaperDto extends PartialType(CreateWallpaperDto) {}
