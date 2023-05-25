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
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';
import { ErrorLogEntity } from './errorLog.entity';
import { EventEntity } from './event.entity';
import { PaymentLogEntity } from './paymentLog.entity';
import { NotionWorkspaceEntity } from './notionWorkspace.entity';

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

    @Column({ type: 'int' })
    opizeId: number;

    @Column({ length: 255, unique: true, nullable: true })
    opizeAccessToken: string;

    @Column({ length: 255, unique: true, nullable: true })
    googleId: string;

    @Column({ length: 300, nullable: true })
    googleAccessToken: string;

    @Column({ length: 255, nullable: true })
    googleEmail: string;

    @Column({ length: 300, nullable: true })
    googleRefreshToken: string;

    @Column({ length: 300, nullable: true })
    notionAccessToken: string;

    @Column({ length: 300, nullable: true })
    notionBotId: string;

    @Column({ length: 300, nullable: true })
    notionDatabaseId: string;

    @Column({ type: 'datetime', nullable: true })
    lastCalendarSync: Date;

    @Column({ length: 300, nullable: true })
    lastSyncStatus: string;

    @Column({ length: 300, default: 'FIRST' })
    status:
        | 'FIRST'
        | 'GOOGLE_SET'
        | 'NOTION_API_SET'
        | 'NOTION_SET'
        | 'FINISHED';

    @Column({ type: 'boolean', default: false })
    isConnected: boolean;

    @Column({ nullable: true })
    syncbotId: string;

    @Column({ default: 'FREE' })
    userPlan: 'FREE' | 'PRO' | 'SPONSOR';

    @Column({ length: 300, default: 'Asia/Seoul' })
    userTimeZone: string;

    @Column({ length: 1000, nullable: true })
    notionProps: string;

    public get parsedNotionProps(): {
        title: string;
        calendar: string;
        date: string;
        delete: string;
        link?: string;
        description?: string;
        location?: string;
    } {
        return JSON.parse(this.notionProps);
    }

    @Column({ type: 'boolean', default: false })
    isWork: boolean;

    @Column({ type: 'datetime', nullable: true })
    workStartedAt: Date;

    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;

    @Column({ type: 'boolean', default: false })
    isPlanUnlimited: boolean;

    @Column({ type: 'datetime', nullable: true })
    lastPaymentTime: Date;

    @Column({ type: 'datetime', nullable: true })
    nextPaymentTime: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt!: Date | null;

    @ManyToOne(() => NotionWorkspaceEntity, (workspace) => workspace.users, {
        eager: true,
    })
    @JoinColumn({ name: 'notionWorkspaceId' })
    notionWorkspace: NotionWorkspaceEntity;

    @Column({ type: 'number', nullable: true })
    notionWorkspaceId: number;

    @OneToMany(() => CalendarEntity, (calendar) => calendar.user)
    calendars: CalendarEntity[];

    @OneToMany(() => EventEntity, (event) => event.user)
    events: EventEntity[];

    @OneToMany(() => ErrorLogEntity, (errorlog) => errorlog.user)
    errorLogs: ErrorLogEntity[];

    @OneToMany(() => PaymentLogEntity, (e) => e.user)
    paymentLogs: PaymentLogEntity[];
}
