import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CalendarEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';

import { GetStatisticsResDto } from './dto/getStatisitics.res.dto';

@Injectable()
export class AdminStatisticsService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(PaymentLogEntity)
        private paymentLogsRepository: Repository<PaymentLogEntity>,
    ) {}

    async getStatistics(): Promise<GetStatisticsResDto> {
        const userCount = await this.usersRepository.count();
        const freeUserCount = await this.usersRepository.count({
            where: {
                userPlan: 'FREE',
            },
        });
        const proUserCount = await this.usersRepository.count({
            where: {
                userPlan: 'PRO',
            },
        });
        const sponserUserCount = await this.usersRepository.count({
            where: {
                userPlan: 'PRO',
            },
        });
        const connectedUserCount = await this.usersRepository.count({
            where: {
                isConnected: true,
            },
        });
        const disconnectedUserCount = userCount - connectedUserCount;

        const calendarCount = await this.calendarsRepository.count();

        const sales = await (
            await this.paymentLogsRepository
                .createQueryBuilder('payment_log')
                .select('SUM(payment_log.price)', 'sum')
                .getRawOne()
        ).sum;

        return {
            user: {
                all: userCount,
                plan: {
                    free: freeUserCount,
                    pro: proUserCount,
                    sponsor: sponserUserCount,
                },
                connect: {
                    connected: connectedUserCount,
                    disconnected: disconnectedUserCount,
                },
            },
            calendar: calendarCount,
            money: sales,
        };
    }
}
