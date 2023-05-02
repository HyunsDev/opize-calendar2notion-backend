import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Migration1UserEntity } from './types/migration1.user.entity';
import { Migration1EventEntity } from './types/migration1.event.entity';

@Injectable()
export class Migration1Query {
    constructor(
        @InjectEntityManager('migration-db')
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * 기존 데이터베이스에서 유저 정보를 가져옵니다.
     * @param userId
     * @returns Migration1UserEntity (with calendars, payment, paymentLogs)
     */
    async findOneUser(userId: number): Promise<Migration1UserEntity> {
        const user = (
            await this.entityManager.query(
                `SELECT * FROM users WHERE users.id = ?`,
                [userId],
            )
        )[0];

        if (!user) {
            return null;
        }

        const payment =
            (
                await this.entityManager.query(
                    'SELECT * FROM payments WHERE payments.userId = ?',
                    [userId],
                )
            )?.[0] ?? null;

        const paymentLogs = await this.entityManager.query(
            'SELECT * FROM payment_logs WHERE payment_logs.userId = ?',
            [userId],
        );

        const calendars = await this.entityManager.query(
            'SELECT * FROM calendars WHERE calendars.userId = ?',
            [userId],
        );

        user.payment = payment;
        user.paymentLogs = paymentLogs;
        user.calendars = calendars;

        return user;
    }

    async findEvents(
        userId: number,
        page: number,
    ): Promise<Migration1EventEntity[]> {
        const events = await this.entityManager.query(
            `SELECT * FROM events WHERE events.userId = ? ORDER BY id desc LIMIT ?, 100`,
            [userId, (page - 1) * 100],
        );

        return events;
    }

    async findEventsSum(userId: number): Promise<number> {
        const sum = (
            await this.entityManager.query(
                `SELECT COUNT(*) as sum FROM events WHERE events.userId = ?`,
                [userId],
            )
        )[0].sum;

        return sum;
    }
}
