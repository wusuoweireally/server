import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PostCategory } from '../entities/post.entity';
import { PaginationQueryDto } from './pagination.dto';

const parseTags = (value: unknown): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : String(value).split(',');
  const normalized = values
    .map(tag => tag.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
};

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsOptional()
  @Transform(({ value }) => parseTags(value), { toClassOnly: true })
  tags?: string[];
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

type SortOrder = 'ASC' | 'DESC';
type PostSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'viewCount'
  | 'likeCount'
  | 'commentCount'
  | 'popular';

export class PostListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'viewCount', 'likeCount', 'commentCount', 'popular'])
  sortBy: PostSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: SortOrder = 'DESC';

  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  authorId?: number;

  @IsOptional()
  @Transform(({ value }) => parseTags(value), { toClassOnly: true })
  tags?: string[];
}
