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

@Entity('migration1')
export class Migration1Entity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    step: 'ACCOUNT' | 'CALENDAR';

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

    @ManyToOne(() => UserEntity, (user) => user.calendars)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'number' })
    userId: number;
}
