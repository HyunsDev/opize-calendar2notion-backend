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
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';
import { ErrorLogEntity } from './errorLog.entity';
import { EventEntity } from './event.entity';
import { SyncLogEntity } from './syncLog.entity';

@Entity('user')
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 128 })
    name: string;

    @Column({ length: 320, unique: true })
    email: string;

    @Column({ length: 2048 })
    imageUrl: string;

    @Column({ length: 255, unique: true, nullable: true })
    googleId: string;

    @Column({ length: 300, nullable: true })
    googleAccessToken: string;

    @Column({ length: 300, nullable: true })
    googleRefreshToken: string;

    @Column({ length: 300, nullable: true })
    notionAccessToken: string;

    @Column({ length: 300, nullable: true })
    notionBotId: string;

    @Column({ length: 300, nullable: true })
    notionDatabaseId: string;

    @Column({ type: 'date', nullable: true })
    lastCalendarSync: Date;

    @Column({ length: 300, nullable: true })
    lastSyncStatus: string;

    @Column({ length: 300, default: 'GOOGLE_SET' })
    status: 'GOOGLE_SET' | 'NOTION_API_SET' | 'NOTION_SET' | 'FINISHED';

    @Column({ type: 'boolean', default: false })
    isConnected: boolean;

    @Column({ default: 'free' })
    userPlan: string;

    @Column({ length: 300, default: 'Asia/Seoul' })
    userTimeZone: string;

    @Column({ type: 'boolean', default: false })
    isWork: boolean;

    @Column({ type: 'date', nullable: true })
    workStartedAt: Date;

    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => CalendarEntity, (calendar) => calendar.user)
    calendars: CalendarEntity[];

    @OneToMany(() => EventEntity, (event) => event.user)
    events: EventEntity[];

    @OneToMany(() => ErrorLogEntity, (errorlog) => errorlog.user)
    errorLogs: ErrorLogEntity[];

    @OneToMany(() => SyncLogEntity, (log) => log.user)
    syncLogs: SyncLogEntity[];
}
