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
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

@Entity('calendar')
export class CalendarEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: '300' })
    googleCalendarId: string;

    @Column({ length: '300' })
    googleCalendarName: string;

    @Column({ length: '300' })
    status: string;

    @Column({ length: '300' })
    accessRole: 'none' | 'freeBusyReader' | 'reader' | 'writer' | 'owner';

    @Column({ length: '300' })
    notionPropertyId: string;

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
}