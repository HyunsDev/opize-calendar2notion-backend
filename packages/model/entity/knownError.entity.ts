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
import { ErrorLogEntity } from './errorLog.entity';
import { EventEntity } from './event.entity';
import { UserEntity } from './user.entity';

@Entity('known_error')
export class KnownErrorEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'string', length: 300 })
    code: string;

    @Column({ type: 'string', length: 300 })
    from: 'GOOGLE CALENDAR' | 'NOTION' | 'SYNCBOT' | 'COMPLEX' | 'UNKNOWN';

    @Column({ type: 'string', length: 300 })
    description: string;

    @Column({ type: 'string', length: 300 })
    guideUrl: string;

    @Column({ type: 'boolean' })
    stopUserSync: boolean;

    @Column({ type: 'boolean' })
    resetLastSyncTime: boolean;

    /**
     * 오류 레벨
     * NOTICE: 오류에 속하지는 않으나 기록
     * WARN: 일부 일정이 무시될 수 있으나 일시적인 오류 or 심각하지 않은 오류
     * ERROR: 유저의 동기화 작업이 불가능한 단계
     * CRIT: 동기화봇 자체의 심각한 오류
     * EMERGENCY: Calendar2notion 자체의 심각한 오류
     */
    @Column({ type: 'string', length: 300 })
    level: 'NOTICE' | 'WARN' | 'ERROR' | 'CRIT' | 'EMERGENCY';

    @Column({ type: 'boolean' })
    noticeUser: boolean;

    @Column({ type: 'boolean' })
    noticeAdmin: boolean;

    @OneToMany(() => ErrorLogEntity, (errorlog) => errorlog.knownError)
    errorLogs: ErrorLogEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
