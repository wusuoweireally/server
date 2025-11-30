import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  postId: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

type CommentSortField = 'createdAt' | 'updatedAt' | 'likeCount';
type SortOrder = 'ASC' | 'DESC';

export class CommentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'likeCount'])
  sortBy: CommentSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: SortOrder = 'ASC';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
