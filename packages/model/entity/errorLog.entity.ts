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
import { KnownErrorEntity } from './knownError.entity';
import { UserEntity } from './user.entity';

@Entity('error_log')
export class ErrorLogEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 300 })
    code: string;

    @Column({ length: 300 })
    from: 'GOOGLE CALENDAR' | 'NOTION' | 'SYNCBOT' | 'COMPLEX' | 'UNKNOWN';

    @Column({ length: 300 })
    description: string;

    @Column({ type: 'mediumtext' })
    detail: string;

    @Column({ type: 'boolean', default: false })
    showUser: boolean;

    @Column({ length: 300 })
    guideUrl: string;

    @ManyToOne(() => KnownErrorEntity, (error) => error.errorLogs)
    knownError: KnownErrorEntity;

    /**
     * 오류 레벨
     * NOTICE: 오류에 속하지는 않으나 기록
     * WARN: 일부 일정이 무시될 수 있으나 일시적인 오류 or 심각하지 않은 오류
     * ERROR: 유저의 동기화 작업이 불가능한 단계
     * CRIT: 동기화봇 자체의 심각한 오류
     * EMERGENCY: Calendar2notion 자체의 심각한 오류
     */
    @Column({ length: 300 })
    level: 'NOTICE' | 'WARN' | 'ERROR' | 'CRIT' | 'EMERGENCY';

    @Column({ type: 'boolean', default: false })
    archive: boolean;

    @ManyToOne(() => UserEntity, (user) => user.errorLogs)
    user: UserEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
