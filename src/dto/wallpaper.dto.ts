import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumberString,
} from 'class-validator';

export class CreateWallpaperDto {
  @IsEnum(['general', 'anime', 'people'])
  @IsOptional()
  category?: 'general' | 'anime' | 'people';

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateWallpaperDto {
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @IsOptional()
  status?: number;
}

export class WallpaperQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string = '1';

  @IsNumberString()
  @IsOptional()
  limit?: string = '20';

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumberString()
  @IsOptional()
  minWidth?: string;

  @IsNumberString()
  @IsOptional()
  maxWidth?: string;

  @IsNumberString()
  @IsOptional()
  minHeight?: string;

  @IsNumberString()
  @IsOptional()
  maxHeight?: string;

  @IsNumberString()
  @IsOptional()
  aspectRatio?: string;

  @IsString()
  @IsOptional()
  category?: 'general' | 'anime' | 'people';
}
