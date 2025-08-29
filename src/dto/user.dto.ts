import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsNumber({}, { message: '用户ID必须是数字' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  id: number;

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: '用户名长度必须在1-50个字符之间' })
  username?: string;

  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  password: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '个人简介长度不能超过500个字符' })
  bio?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: '用户名长度必须在1-50个字符之间' })
  username?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  password?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '个人简介长度不能超过500个字符' })
  bio?: string;
}

export class LoginDto {
  @IsNumber({}, { message: '用户ID必须是数字' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  id: number;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
