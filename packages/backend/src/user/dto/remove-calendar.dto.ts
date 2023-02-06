import { IsString } from 'class-validator';

export class RemoveCalendarDto {
  @IsString()
  googleCalendarId: string;
}
