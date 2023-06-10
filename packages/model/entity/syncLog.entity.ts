import {
    Column,
    Entity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

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

    @Column({ type: 'int' })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(
        partial: Omit<
            SyncLogEntity,
            'id' | 'createdAt' | 'updatedAt' | 'userId'
        >,
    ) {
        Object.assign(this, partial);
    }
}
