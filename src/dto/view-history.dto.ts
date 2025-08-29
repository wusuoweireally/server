import { IsNumber } from 'class-validator';

export class CreateViewHistoryDto {
  @IsNumber()
  wallpaperId: number;

  @IsNumber()
  userId: number;
}

export class ViewHistoryQueryDto {
  @IsNumber()
  userId: number;
}