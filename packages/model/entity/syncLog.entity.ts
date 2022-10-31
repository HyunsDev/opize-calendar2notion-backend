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
import { KnownErrorEntity } from './knownError.entity';
import { UserEntity } from './user.entity';

@Entity('sync_log')
export class SyncLogEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'mediumtext' })
    detail: string;

    @Column()
    status: 'SUCCESS' | 'FAIL' | 'WORKING' | 'CANCELED';

    @Column({ type: 'int', nullable: true })
    workingTime: number;

    @Column({ type: 'boolean', default: false })
    archive: boolean;

    @ManyToOne(() => UserEntity, (user) => user.syncLogs)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'int' })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ErrorLogEntity, (error) => error.syncLog)
    errorLogs: ErrorLogEntity[];
}
