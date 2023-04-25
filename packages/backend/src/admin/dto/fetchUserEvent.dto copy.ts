import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FetchUserEvent {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  googleCalendarEventId?: string;

  @IsOptional()
  @IsString()
  notionPageId?: string;
}
