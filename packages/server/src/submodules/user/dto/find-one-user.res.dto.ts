import { UserEntity } from '@opize/calendar2notion-entity';
import {
    CalendarDto,
    PaymentLogDto,
    UserDto,
} from '@opize/calendar2notion-object';

type GoogleCalendars = {
    id: string;
    summary: string;
    primary: boolean;
    backgroundColor: string;
    foregroundColor: string;
    accessRole: 'none' | 'freeBusyReader' | 'reader' | 'writer' | 'owner';
};

export class FindOneUserResDto extends UserDto {
    calendars: CalendarDto[];
    googleCalendars: GoogleCalendars[];
    paymentLogs: PaymentLogDto[];

    constructor(user: UserEntity, googleCalendars: GoogleCalendars[]) {
        super(user);
        this.calendars = user.calendars.map((calendar) =>
            CalendarDto.from(calendar),
        );
        this.googleCalendars = googleCalendars;
        this.paymentLogs = user.paymentLogs.map(
            (paymentLog) => new PaymentLogDto(paymentLog),
        );
    }
}
