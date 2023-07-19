import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentLogEntity, UserEntity } from '@opize/calendar2notion-object';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { Repository } from 'typeorm';

import { PlanUpgradeReqDto } from './dto/planUpgrade.req.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AdminUserPlanService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(PaymentLogEntity)
        private paymentLogsRepository: Repository<PaymentLogEntity>,
    ) {}

    async upgradePlan(userId: number, dto: PlanUpgradeReqDto): Promise<void> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException({
                message: '유저를 찾을 수 없어요',
            });
        }

        const now = dayjs().tz('Asia/Seoul');
        let nextPaymentTime: Date;
        if (user.nextPaymentTime) {
            const months = +dto.months.replace('+', '');
            user.userPlan = dto.plan;
            nextPaymentTime = dto.months.includes('+')
                ? dayjs(user.nextPaymentTime)
                      .tz('Asia/Seoul')
                      .add(months, 'months')
                      .toDate()
                : now.add(months, 'months').toDate();
            user.nextPaymentTime = nextPaymentTime;
            await this.usersRepository.save(user);
        } else {
            const months = +dto.months.replace('+', '');
            user.userPlan = dto.plan;
            nextPaymentTime = now.add(months, 'months').toDate();
            user.nextPaymentTime = nextPaymentTime;
            await this.usersRepository.save(user);
        }

        const paymentLog = PaymentLogEntity.create({
            plan: dto.plan,
            paymentKind: dto.paymentKind,
            price: dto.price,
            priceKind: dto.priceKind,
            expirationTime: nextPaymentTime,
            memo: dto.memo,
            paymentTime: now.toDate(),
            user,
            months: dto.months,
        });
        paymentLog.plan = dto.plan;
        paymentLog.paymentKind = dto.paymentKind;
        paymentLog.price = dto.price;
        paymentLog.priceKind = dto.priceKind;
        paymentLog.expirationTime = nextPaymentTime;
        paymentLog.memo = dto.memo;
        paymentLog.paymentTime = now.toDate();
        paymentLog.user = user;
        paymentLog.months = dto.months;
        await this.paymentLogsRepository.save(paymentLog);
    }
}
