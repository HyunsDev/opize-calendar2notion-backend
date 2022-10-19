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

    @Column({ type: 'string', length: 128 })
    name: string;

    @Column({ type: 'string', length: 320, unique: true })
    email: string;

    @Column({ type: 'string', length: 2048 })
    imageUrl: string;

    @Column({ type: 'string', length: 255, unique: true })
    googleId: string;

    @Column({ type: 'string', length: 300, nullable: true })
    googleAccessToken: string;

    @Column({ type: 'string', length: 300, nullable: true })
    googleRefreshToken: string;

    @Column({ type: 'string', length: 300, nullable: true })
    notionAccessToken: string;

    @Column({ type: 'string', length: 300, nullable: true })
    notionBotId: string;

    @Column({ type: 'string', length: 300, nullable: true })
    notionDatabaseId: string;

    @Column({ type: 'date' })
    lastCalendarSync: Date;

    @Column({ type: 'string', length: 300, nullable: true })
    lastSyncStatus: string;

    @Column({ type: 'string', length: 300, default: 'GOOGLE_SET' })
    status: 'GOOGLE_SET' | 'NOTION_API_SET' | 'NOTION_SET' | 'FINISHED';

    @Column({ type: 'boolean', default: false })
    isConnected: boolean;

    @Column({ type: 'string', default: 'free' })
    userPlan: string;

    @Column({ type: 'string', length: 300, default: 'Asia/Seoul' })
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
