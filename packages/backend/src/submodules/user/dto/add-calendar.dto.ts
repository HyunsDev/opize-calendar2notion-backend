import { IsString } from 'class-validator';

export class AddCalendarDto {
    @IsString()
    googleCalendarId: string;
}
