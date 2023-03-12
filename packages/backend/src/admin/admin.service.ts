import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CalendarEntity,
  ErrorLogEntity,
  EventEntity,
  UserEntity,
} from '@opize/calendar2notion-model';
import { FindManyOptions, Not, Repository } from 'typeorm';
import { google } from 'googleapis';
import { Client } from '@notionhq/client';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UserPlanUpgradeDto } from './dto/plan-upgrade.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaymentLogEntity } from '@opize/calendar2notion-model/dist/entity/paymentLog.entity';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(CalendarEntity)
    private calendarsRepository: Repository<CalendarEntity>,
    @InjectRepository(EventEntity)
    private eventsRepository: Repository<EventEntity>,
    @InjectRepository(PaymentLogEntity)
    private paymentLogsRepository: Repository<PaymentLogEntity>,
    @InjectRepository(ErrorLogEntity)
    private errorLogsRepository: Repository<ErrorLogEntity>,
    private readonly httpService: HttpService,
  ) {}

  async findUser(option: {
    email?: string;
    googleEmail?: string;
    id?: number;
    opizeId?: number;
  }) {
    const user = await this.usersRepository.findOne({
      where: option,
    });

    if (!user) {
      throw new NotFoundException({ message: '유저를 찾을 수 없습니다.' });
    }

    const calendars = await this.calendarsRepository.find({
      where: {
        userId: user.id,
      },
    });

    const paymentLogs = await this.paymentLogsRepository.find({
      where: {
        userId: user.id,
      },
    });

    const notion = new Client({
      auth: user.notionAccessToken,
    });

    return {
      user,
      calendars,
      paymentLogs,
    };
  }

  async findWorkingUsers() {
    return await this.usersRepository.find({
      where: {
        isWork: true,
      },
    });
  }

  async updateUser(userId: number, dto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({ message: '유저를 찾을 수 없습니다.' });
    }

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.imageUrl) user.imageUrl = dto.imageUrl;
    if (dto.opizeId) user.opizeId = dto.opizeId;
    if (dto.opizeAccessToken) user.opizeAccessToken = dto.opizeAccessToken;
    if (dto.googleId) user.googleId = dto.googleId;
    if (dto.googleAccessToken) user.googleAccessToken = dto.googleAccessToken;
    if (dto.googleEmail) user.googleEmail = dto.googleEmail;
    if (dto.googleRefreshToken)
      user.googleRefreshToken = dto.googleRefreshToken;
    if (dto.notionAccessToken) user.notionAccessToken = dto.notionAccessToken;
    if (dto.notionBotId) user.notionBotId = dto.notionBotId;
    if (dto.lastCalendarSync)
      user.lastCalendarSync = new Date(dto.lastCalendarSync);
    if (dto.lastSyncStatus) user.lastSyncStatus = dto.lastSyncStatus;
    if (dto.status) user.status = dto.status;
    if (dto.isConnected !== undefined) user.isConnected = dto.isConnected;
    if (dto.userPlan) user.userPlan = dto.userPlan;
    if (dto.userTimeZone) user.userTimeZone = dto.userTimeZone;
    if (dto.notionProps) user.notionProps = dto.notionProps;
    if (dto.isWork !== undefined) user.isWork = dto.isWork;

    await this.usersRepository.save(user);
  }

  async forceDeleteUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({ message: '유저를 찾을 수 없습니다.' });
    }

    await this.eventsRepository.delete({
      userId: user.id,
    });
    await this.errorLogsRepository.delete({
      userId: user.id,
    });

    await this.calendarsRepository.delete({
      userId: user.id,
    });
    await this.paymentLogsRepository.delete({
      userId: user.id,
    });
    await this.usersRepository.delete({
      id: user.id,
    });

    return;
  }

  async planUpgrade(userId: number, dto: UserPlanUpgradeDto) {
    const now = dayjs().tz('Asia/Seoul');
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: '유저를 찾을 수 없어요',
      });
    }

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

    const paymentLog = new PaymentLogEntity();
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

    return;
  }

  async statistics() {
    const res = {
      user: {
        all: await this.usersRepository.count(),
        plan: {
          free: await this.usersRepository.count({
            where: { userPlan: 'FREE' },
          }),
          pro: await this.usersRepository.count({ where: { userPlan: 'PRO' } }),
        },
        connect: {
          connected: await this.usersRepository.count({
            where: { isConnected: true },
          }),
          disconnected: await this.usersRepository.count({
            where: { isConnected: false },
          }),
        },
      },
      calendar: await this.calendarsRepository.count(),
      money: (
        await this.paymentLogsRepository
          .createQueryBuilder('payment_log')
          .select('SUM(payment_log.price)', 'sum')
          .getRawOne()
      ).sum,
    };
    return res;
  }

  async getErrorList(page: number, pageSize: number, userId?: number) {
    const list = await this.errorLogsRepository.find({
      take: pageSize,
      skip: page * pageSize,
      where: {
        userId: userId,
      },
      order: {
        createdAt: {
          direction: 'DESC',
        },
      },
      relations: ['user'],
    });
    return list;
  }

  async deleteError(id: number) {
    await this.errorLogsRepository.delete({
      id: id,
    });
  }

  async findUsers(where: FindManyOptions<UserEntity>['where'], page: number) {
    const PAGE_SIZE = 50;

    try {
      const users = await this.usersRepository.find({
        where: where,
        relations: [],
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      return {
        page: page,
        users: users,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException({
        code: 'BAD_REQUEST',
      });
    }
  }
}
