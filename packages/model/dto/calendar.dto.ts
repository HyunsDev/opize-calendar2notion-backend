import { IsIn, IsNumber, IsString } from 'class-validator';
import { CalendarEntity } from '../entity';
import { Expose, plainToClass } from 'class-transformer';

export type CalendarStatus = 'DISCONNECTED' | 'PENDING' | 'CONNECTED';
export type CalendarAccessRole =
    | 'none'
    | 'freeBusyReader'
    | 'reader'
    | 'writer'
    | 'owner';

export class CalendarDto {
    @Expose()
    @IsNumber()
    id: number;

    @Expose()
    @IsString()
    googleCalendarId: string;

    @Expose()
    @IsString()
    googleCalendarName: string;

    @Expose()
    @IsIn(['DISCONNECTED', 'PENDING', 'CONNECTED'])
    status: CalendarStatus;

    @Expose()
    @IsIn(['none', 'freeBusyReader', 'reader', 'writer', 'owner'])
    accessRole: CalendarAccessRole;

    @Expose()
    @IsString()
    notionPropertyId?: string;

    @Expose()
    @IsNumber()
    userId: number;

    @Expose()
    @IsString()
    createdAt: Date;

    constructor(calendar: CalendarEntity) {
        if (!calendar) return;
        Object.assign(
            this,
            plainToClass(CalendarDto, calendar, {
                excludeExtraneousValues: true,
            }),
        );
    }
}
