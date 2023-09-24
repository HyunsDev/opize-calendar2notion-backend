import {
    Column,
    Entity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type ErrorLogFrom =
    | 'GOOGLE CALENDAR'
    | 'NOTION'
    | 'SYNCBOT'
    | 'COMPLEX'
    | 'UNKNOWN';
export type ErrorLogLevel = 'NOTICE' | 'WARN' | 'ERROR' | 'CRIT' | 'EMERGENCY';
export type ErrorLogFinishWork = 'STOP' | 'RETRY';

@Entity('error_log')
export class ErrorLogEntity {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 오류 코드입니다.
     */
    @Column({ length: 300 })
    code: string;

    /**
     * 오류의 발생 위치입니다.
     */
    @Column({ length: 300 })
    from: ErrorLogFrom;

    /**
     * 개발자가 쉽게 오류를 해결 할 수 있도록 돕는 오류의 설명입니다.
     */
    @Column({ length: 300 })
    description: string;

    /**
     * 오류와 관련한 세부 데이터를 포함합니다.
     */
    @Column({ type: 'mediumtext', nullable: true })
    detail?: string;

    /**
     * 오류의 스택입니다.
     */
    @Column({ type: 'mediumtext', nullable: true })
    stack?: string;

    /**
     * 오류 레벨
     * - NOTICE: 오류에 속하지는 않으나 기록
     * - WARN: 일부 일정이 무시될 수 있으나 일시적인 오류 or 심각하지 않은 오류
     * - ERROR: 유저의 동기화 작업이 불가능한 단계
     * - CRIT: 동기화봇 자체의 심각한 오류
     * - EMERGENCY: Calendar2notion 자체의 심각한 오류
     */
    @Column({ length: 300 })
    level: ErrorLogLevel;

    /**
     * 오류의 장기 보관 여부입니다. 이 값이 `false`인 경우 특정 기간이 지난 후 동기화가 성공했을 때 삭제됩니다.
     */
    @Column({ type: 'boolean', default: false })
    archive: boolean;

    /**
     * 오류가 발생했을 때 다음 작업을 시도하는지 여부입니다.
     */
    @Column({ length: 300 })
    finishWork: ErrorLogFinishWork;

    @ManyToOne(() => UserEntity, (user) => user.errorLogs)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'int' })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    static create(data: {
        code: string;
        from: ErrorLogFrom;
        description: string;
        detail?: string;
        stack?: string;
        level: ErrorLogLevel;
        archive?: boolean;
        finishWork: ErrorLogFinishWork;
        user: UserEntity;
    }) {
        const errorLog = new ErrorLogEntity();
        errorLog.code = data.code;
        errorLog.from = data.from;
        errorLog.description = data.description;
        errorLog.detail = data.detail;
        errorLog.stack = data.stack;
        errorLog.level = data.level;
        errorLog.archive = data.archive;
        errorLog.finishWork = data.finishWork;
        errorLog.user = data.user;

        return errorLog;
    }
}
