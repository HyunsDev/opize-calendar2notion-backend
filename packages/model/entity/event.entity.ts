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

    constructor(
        partial: Pick<
            EventEntity,
            | 'googleCalendarEventId'
            | 'notionPageId'
            | 'googleCalendarCalendarId'
            | 'status'
            | 'willRemove'
            | 'user'
            | 'calendar'
            | 'lastNotionUpdate'
            | 'lastGoogleCalendarUpdate'
        >,
    ) {
        Object.assign(this, partial);
    }
}
