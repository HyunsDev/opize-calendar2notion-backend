import {
    AfterLoad,
    Column,
    Entity,
    ManyToMany,
    OneToMany,
    PrimaryColumn,
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

    @Column({ type: 'string', length: '300' })
    googleCalendarEventId: string;

    @Column({ type: 'string', length: '300' })
    notionPageId: string;

    @Column({ type: 'string', length: '300' })
    googleCalendarId: string;

    @Column({ type: 'datetime', length: '300' })
    lastNotionUpdate: Date;

    @Column({ type: 'datetime' })
    lastGoogleCalendarUpdate: Date;

    @Column({ type: 'string', length: '300' })
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
}
