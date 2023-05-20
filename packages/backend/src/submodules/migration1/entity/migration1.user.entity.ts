import { Migration1CalendarEntity } from './migration1.calendar.entity';
import { Migration1PaymentEntity } from './migration1.payment.entity';
import { Migration1PaymentLogEntity } from './migration1.paymentLog.entity';

export type Migration1UserEntity = {
    id: number;
    name: string;
    email: string;
    imageUrl: string;
    googleId: string;
    notionAccessToken: string;
    notionDatabaseId: string;
    lastCalendarSync: string;
    status: string;
    userPlan: string;
    userDonate: string;
    userTimeZone: string;
    isOccupied: 0 | 1;
    isWork: 0 | 1;
    createdAt: string;
    updatedAt: string;

    calendars?: Migration1CalendarEntity[];
    paymentLogs?: Migration1PaymentLogEntity[];
    payment?: Migration1PaymentEntity;
};
