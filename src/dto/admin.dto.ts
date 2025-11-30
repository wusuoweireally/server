import {
  IsArray,
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UpdateWallpaperDto } from './wallpaper.dto';

export class AdminUserQueryDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @Type(() => Number)
  @IsOptional()
  status?: number;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AdminCreateUserDto extends CreateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AdminUpdateUserDto extends UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(1)
  status: number;
}

export class AdminWallpaperQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @IsOptional()
  @IsNumberString()
  limit?: string = '20';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  status?: string;

  @IsOptional()
  @IsNumberString()
  uploaderId?: string;

  @IsOptional()
  @IsString()
  category?: 'general' | 'anime' | 'people';
}

export class AdminUpdateWallpaperDto extends UpdateWallpaperDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: 'general' | 'anime' | 'people';
}

export class AdminUpdateWallpaperTagsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  tags?: string[];
}
