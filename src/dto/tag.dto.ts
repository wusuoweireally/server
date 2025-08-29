import { IsString, IsOptional, Length } from 'class-validator';

export class CreateTagDto {
  @IsString({ message: '标签名称必须是字符串' })
  @Length(1, 50, { message: '标签名称长度必须在1-50个字符之间' })
  name: string;
}

export class SearchTagsDto {
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  keyword?: string;

  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: '排序方向必须是字符串' })
  sortOrder?: 'ASC' | 'DESC';
}
