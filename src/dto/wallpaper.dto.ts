import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumberString,
  Length,
} from 'class-validator';

export class CreateWallpaperDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '标题长度必须在1-100个字符之间' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '描述长度不能超过500个字符' })
  description?: string;

  @IsEnum(['general', 'anime', 'people'])
  @IsOptional()
  category?: 'general' | 'anime' | 'people';

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateWallpaperDto {
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '标题长度必须在1-100个字符之间' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '描述长度不能超过500个字符' })
  description?: string;

  @IsEnum(['general', 'anime', 'people'])
  @IsOptional()
  category?: 'general' | 'anime' | 'people';
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

  @IsString()
  @IsOptional()
  format?: string;

  @IsNumberString()
  @IsOptional()
  minFileSize?: string;

  @IsNumberString()
  @IsOptional()
  maxFileSize?: string;

  @IsString()
  @IsOptional()
  tagKeyword?: string;
}
