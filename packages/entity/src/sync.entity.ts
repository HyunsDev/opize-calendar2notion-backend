import { Column, Entity, OneToOne } from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * 동기화 정보를 나타내는 엔티티입니다.
 */

@Entity('sync')
export class SyncEntity {
    @OneToOne(() => UserEntity, (user) => user.sync)
    user: UserEntity;

    /**
     * 현재 동기화가 활성화 되어 있는지 여부입니다.
     * 동기화가 실패하거나, 유저/관지라가 동기화를 중지하면 `false`로 변경됩니다.
     */
    @Column({ type: 'boolean', default: false })
    isConnected: boolean;

    /**
     * 동기화가 유저, 관리자에 의해 강제로 중지되었는지 여부입니다.
     * 동기화는 `isConnected`가 `true`이고, `isForcedStopped`가 `false`일 때 진행됩니다.
     */
    @Column({ type: 'boolean', default: false })
    isForcedStopped: boolean;

    /**
     * 현재 유저가 동기화 중인지를 나타냅니다.
     */
    @Column({ type: 'boolean', default: false })
    isWork: boolean;

    /**
     * 현재 동기화중인 봇의 아이디입니다.
     */
    @Column({ nullable: true })
    syncbotId: string;

    /**
     * 동기화봇의 버전입니다.
     */
    @Column({ length: 300, nullable: true })
    syncbotVersion: string;

    /**
     * 동기화가 시작된 시간입니다.
     */
    @Column({ type: 'datetime', nullable: true })
    workStartedAt: Date;

    /**
     * 마지막으로 동기화를 시작했을 때의 시간입니다.
     */
    @Column({ type: 'datetime', nullable: true })
    lastSyncStartedAt: Date;

    /**
     * 마지막으로 동기화를 성공했을 때의 시간입니다.
     */
    @Column({ type: 'datetime', nullable: true })
    lastSyncSuccessAt: Date;

    /**
     * 마지막으로 동기화 했을 때의 상태입니다.
     */
    @Column({ length: 300, nullable: true })
    lastSyncStatus: string;

    /**
     * 마지막으로 동기화 했을 때의 상태가 반복된 횟수입니다.
     */
    @Column({ type: 'int', default: 0 })
    lastSyncStatusRepeatedCount: number;
}
