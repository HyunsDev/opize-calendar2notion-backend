import {
    Column,
    Entity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';
import { UserEntity } from './user.entity';

@Entity('event')
export class EventEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: '300' })
    googleCalendarEventId: string;

    @Column({ length: '300' })
    notionPageId: string;

    @Column({ length: '300' })
    googleCalendarCalendarId: string;

    @Column({ type: 'datetime' })
    lastNotionUpdate: Date;

    @Column({ type: 'datetime' })
    lastGoogleCalendarUpdate: Date;

    @Column({ length: '300' })
    status: 'READY' | 'SYNCED';

    @Column({ type: 'boolean' })
    willRemove: boolean;

    @ManyToOne(() => UserEntity, (user) => user.events)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'number' })
    userId: number;

    @ManyToOne(() => CalendarEntity, (calendar) => calendar.events)
    @JoinColumn({ name: 'calendarId' })
    calendar: CalendarEntity;

    @Column({ type: 'number' })
    calendarId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    static create(data: {
        googleCalendarEventId: string;
        notionPageId: string;
        googleCalendarCalendarId: string;
        status: 'READY' | 'SYNCED';
        willRemove: boolean;
        user: UserEntity;
        calendar: CalendarEntity;
        lastNotionUpdate: Date;
        lastGoogleCalendarUpdate: Date;
    }) {
        const event = new EventEntity();
        event.googleCalendarEventId = data.googleCalendarEventId;
        event.notionPageId = data.notionPageId;
        event.googleCalendarCalendarId = data.googleCalendarCalendarId;
        event.status = data.status;
        event.willRemove = data.willRemove;
        event.user = data.user;
        event.calendar = data.calendar;
        event.lastNotionUpdate = data.lastNotionUpdate;
        event.lastGoogleCalendarUpdate = data.lastGoogleCalendarUpdate;

        return event;
    }
}
