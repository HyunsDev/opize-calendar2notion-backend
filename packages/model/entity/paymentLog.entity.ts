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

@Entity('payment_log')
export class PaymentLogEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    plan: 'FREE' | 'PRO';

    @Column()
    paymentKind: string;

    @Column({ type: 'int', default: 0 })
    price: number;

    @Column()
    priceKind: string;

    @Column()
    paymentTime: Date;

    @Column()
    months: string;

    @Column()
    expirationTime: Date;

    @Column({ type: 'mediumtext' })
    memo: string;

    @ManyToOne(() => UserEntity, (user) => user.paymentLogs)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'int' })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(
        partial: Omit<
            PaymentLogEntity,
            'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId'
        >,
    ) {
        Object.assign(this, partial);
    }
}
