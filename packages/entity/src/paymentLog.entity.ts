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

    static create(data: {
        plan: 'FREE' | 'PRO';
        paymentKind: string;
        price: number;
        priceKind: string;
        paymentTime: Date;
        months: string;
        expirationTime: Date;
        memo: string;
        user: UserEntity;
    }) {
        const paymentLog = new PaymentLogEntity();
        paymentLog.plan = data.plan;
        paymentLog.paymentKind = data.paymentKind;
        paymentLog.price = data.price;
        paymentLog.priceKind = data.priceKind;
        paymentLog.paymentTime = data.paymentTime;
        paymentLog.months = data.months;
        paymentLog.expirationTime = data.expirationTime;
        paymentLog.memo = data.memo;
        paymentLog.user = data.user;

        return paymentLog;
    }
}
