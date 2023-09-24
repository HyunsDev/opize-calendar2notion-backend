import {
    Column,
    Entity,
    OneToMany,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

export type CalendarStatus = 'DISCONNECTED' | 'PENDING' | 'CONNECTED';

export type CalendarAccessRole =
    | 'none'
    | 'freeBusyReader'
    | 'reader'
    | 'writer'
    | 'owner';

@Entity('calendar')
export class CalendarEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: '500' })
    googleCalendarId: string;

    @Column({ length: '300' })
    googleCalendarName: string;

    @Column({ length: '300', default: 'PENDING' })
    status: CalendarStatus;

    @Column({ length: '300' })
    accessRole: CalendarAccessRole;

    @Column({ length: '300', nullable: true })
    notionPropertyId?: string;

    @ManyToOne(() => UserEntity, (user) => user.calendars)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'number' })
    userId: number;

    @OneToMany(() => EventEntity, (event) => event.calendar)
    events: EventEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    static create(data: {
        googleCalendarId: string;
        googleCalendarName: string;
        accessRole: CalendarAccessRole;
        user: UserEntity;
    }) {
        const calendar = new CalendarEntity();
        calendar.googleCalendarId = data.googleCalendarId;
        calendar.googleCalendarName = data.googleCalendarName;
        calendar.accessRole = data.accessRole;
        calendar.user = data.user;

        return calendar;
    }
}
