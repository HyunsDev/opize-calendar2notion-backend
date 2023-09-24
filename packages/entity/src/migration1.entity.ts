import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type Migration1Step = 'ACCOUNT' | 'CALENDAR';

@Entity('migration1')
export class Migration1Entity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    step: Migration1Step;

    @Column({ type: 'int' })
    migrationUserId: number;

    @Column()
    migrationUserEmail: string;

    @Column()
    migrationUserName: string;

    @Column()
    migrationUserGoogleId: string;

    @Column()
    plan: 'FREE' | 'PRO';

    @Column({ type: 'mediumtext' })
    migrationData: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt!: Date | null;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'number' })
    userId: number;

    static create(data: {
        step: Migration1Step;
        migrationUserId: number;
        migrationUserEmail: string;
        migrationUserName: string;
        migrationUserGoogleId: string;
        plan: 'FREE' | 'PRO';
        migrationData: string;
        user: UserEntity;
    }) {
        const migration1 = new Migration1Entity();
        migration1.step = data.step;
        migration1.migrationUserId = data.migrationUserId;
        migration1.migrationUserEmail = data.migrationUserEmail;
        migration1.migrationUserName = data.migrationUserName;
        migration1.migrationUserGoogleId = data.migrationUserGoogleId;
        migration1.plan = data.plan;
        migration1.migrationData = data.migrationData;
        migration1.user = data.user;

        return migration1;
    }
}
