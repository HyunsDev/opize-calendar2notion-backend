import {
    Column,
    Entity,
    OneToMany,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';
import { ErrorLogEntity } from './errorLog.entity';
import { EventEntity } from './event.entity';
import { PaymentLogEntity } from './paymentLog.entity';
import { NotionWorkspaceEntity } from './notionWorkspace.entity';
import { SyncEntity } from './sync.entity';

export type UserStatus =
    | 'FIRST'
    | 'GOOGLE_SET'
    | 'NOTION_API_SET'
    | 'NOTION_SET'
    | 'FINISHED';

export type UserPlan = 'FREE' | 'PRO' | 'SPONSOR';

export type UserNotionProps = {
    title: string;
    calendar: string;
    date: string;
    delete: string;
    link?: string;
    description?: string;
    location?: string;
    last_edited_by?: string;
};

@Entity('user')
export class UserEntity {
    /**
     * User의 고유 아이디입니다.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 유저의 이름입니다.
     */
    @Column({ length: 128 })
    name: string;

    /**
     * 유저의 Opize 이메일입니다.
     */
    @Column({ length: 320, unique: true })
    email: string;

    /**
     * 유저의 프로필 사진입니다.
     */
    @Column({ length: 2048 })
    imageUrl: string;

    /**
     * 유저의 Opize 아이디입니다. 삭제 후 재가입한 유저의 존재로 인해 유일하지 않습니다.
     */
    @Column({ type: 'int' })
    opizeId: number;

    /**
     * 유저의 Opize Access Token입니다.
     */
    @Column({ length: 255, unique: true, nullable: true })
    opizeAccessToken: string;

    /**
     * 유저의 Google ID입니다.
     */
    @Column({ length: 255, unique: true, nullable: true })
    googleId: string;

    /**
     * 유저의 Google Access Token입니다.
     */
    @Column({ length: 300, nullable: true })
    googleAccessToken: string;

    /**
     * 유저의 Google 이메일입니다.
     */
    @Column({ length: 255, nullable: true })
    googleEmail: string;

    /**
     * 유저의 Google Refresh Token입니다.
     */
    @Column({ length: 300, nullable: true })
    googleRefreshToken: string;

    /**
     * 유저의 notionAccessToken입니다. 더 이상 추가로 등록되지 않으며, notionWorkspace를 사용해야 합니다.
     * @deprecated
     * @see notionWorkspace
     */
    @Column({ length: 300, nullable: true })
    notionAccessToken: string;

    /**
     * 유저의 notionBotId입니다. 더 이상 추가로 등록되지 않으며, notionWorkspace를 사용해야 합니다.
     * @deprecated
     * @see notionWorkspace
     */
    @Column({ length: 300, nullable: true })
    notionBotId: string;

    @Column({ length: 300, nullable: true })
    notionDatabaseId: string;

    /**
     * 마지막으로 동기화된 시간입니다.
     * @deprecated {@link SyncEntity.lastSyncStartedAt}를 사용하세요.
     */
    @Column({ type: 'datetime', nullable: true })
    lastCalendarSync: Date;

    /**
     * 마지막으로 동기화했을 때의 상태입니다.
     * @deprecated {@link SyncEntity.lastSyncStatus}를 사용하세요.
     */
    @Column({ length: 300, nullable: true })
    lastSyncStatus: string;

    /**
     * 현재 유저의 연결 상태를 나타냅니다.
     */
    @Column({ length: 300, default: 'FIRST' })
    status: UserStatus;

    /**
     * 유저가 동기화를 활성화했는지 여부입니다.
     * @deprecated {@link SyncEntity.isConnected}를 사용하세요.
     */
    @Column({ type: 'boolean', default: false })
    isConnected: boolean;

    /**
     * 현재 동기화하고 있는 봇의 아이디입니다.
     * @deprecated {@link SyncEntity.syncbotId}를 사용하세요.
     */
    @Column({ nullable: true })
    syncbotId: string;

    /**
     * 유저의 플랜입니다.
     */
    @Column({ default: 'FREE' })
    userPlan: UserPlan;

    /**
     * 유저의 타입존입니다.
     */
    @Column({ length: 300, default: 'Asia/Seoul' })
    userTimeZone: string;

    /**
     * 유저의 노션 데이터베이스 속성 ID 정보입니다. 사용시 JSON으로 파싱하여 이용합니다. parsedNotionProps를 통해 파싱된 정보를 얻을 수 있습니다.
     */
    @Column({ length: 1000, nullable: true })
    notionProps: string;

    public get parsedNotionProps(): UserNotionProps {
        return JSON.parse(this.notionProps);
    }

    /**
     * 현재 유저가 동기화 중인지를 나타냅니다.
     * @deprecated {@link SyncEntity.isWork}를 사용하세요.
     */
    @Column({ type: 'boolean', default: false })
    isWork: boolean;

    /**
     * 현재 동기화가 언제 시작됬는지를 나타냅니다.
     * @deprecated {@link SyncEntity.workStartedAt}를 사용하세요.
     */
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

    @Column({ type: 'int', default: 1 })
    googleRedirectUrlVersion: number;

    /**
     * 0: 기존 동기화 기간: env.MIN_DATE ~ env.MAX_DATE
     * (연도): 신규 동기화 기간:
     *  TIME_MIN: (연도)-01-01T00:00:00.000Z
     *  TIME_MAX: env.MAX_DATE
     */
    @Column({ type: 'int', default: 0 })
    syncYear: number;

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

    @OneToOne(() => SyncEntity, (sync) => sync.user)
    sync: SyncEntity;

    static create(data: {
        name: string;
        email: string;
        imageUrl: string;
        opizeId: number;
        opizeAccessToken: string;
    }) {
        const user = new UserEntity();
        user.name = data.name;
        user.email = data.email;
        user.imageUrl = data.imageUrl;
        user.opizeId = data.opizeId;
        user.opizeAccessToken = data.opizeAccessToken;

        return user;
    }
}
