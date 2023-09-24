import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-entity';
import { FindManyOptions, Repository } from 'typeorm';

import { SearchUserResDto } from './dto/searchUser.res.dto';
import { SearchUsersResDto } from './dto/searchUsers.res.dto';
import { UpdateUserReqDto } from './dto/updateUser.req.dto';

@Injectable()
export class AdminUserService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    /**
     * 유저를 검색합니다.
     * @param option
     * @returns
     */
    async searchUser(option: {
        email?: string;
        googleEmail?: string;
        id?: number;
        opizeId?: number;
    }): Promise<SearchUserResDto> {
        const user = await this.usersRepository.findOne({
            where: option,
            relations: ['calendars', 'paymentLogs'],
        });

        if (!user) {
            throw new NotFoundException({
                message: '유저를 찾을 수 없습니다.',
            });
        }

        return {
            user,
        };
    }

    /**
     * 특정 조건의 유저들을 검색합니다.
     * 한 번에 50개의 데이터를 가져옵니다.
     * @param where
     * @param page
     * @returns
     */
    async searchUsers(
        where: FindManyOptions<UserEntity>['where'],
        page: number,
    ): Promise<SearchUsersResDto> {
        const PAGE_SIZE = 50;

        try {
            const [users, count] = await this.usersRepository.findAndCount({
                where,
                take: PAGE_SIZE,
                skip: PAGE_SIZE * (page - 1),
            });

            return {
                users,
                page,
                count,
            };
        } catch (err) {
            throw new BadRequestException({
                code: 'BAD_REQUEST',
            });
        }
    }

    async getExpirationUsers() {
        const currentDate = new Date().toISOString();

        const users = await this.usersRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.paymentLogs', 'paymentLog')
            .where('paymentLog.expirationTime < :currentDate', { currentDate })
            .getMany();

        return {
            users,
        };
    }

    async updateUser(userId: number, dto: UpdateUserReqDto) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException({
                message: '유저를 찾을 수 없습니다.',
            });
        }

        if (dto.name) user.name = dto.name;
        if (dto.email) user.email = dto.email;
        if (dto.imageUrl) user.imageUrl = dto.imageUrl;
        if (dto.opizeId) user.opizeId = dto.opizeId;
        if (dto.opizeAccessToken) user.opizeAccessToken = dto.opizeAccessToken;
        if (dto.googleId) user.googleId = dto.googleId;
        if (dto.googleAccessToken)
            user.googleAccessToken = dto.googleAccessToken;
        if (dto.googleEmail) user.googleEmail = dto.googleEmail;
        if (dto.googleRefreshToken)
            user.googleRefreshToken = dto.googleRefreshToken;
        if (dto.notionAccessToken)
            user.notionAccessToken = dto.notionAccessToken;
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
}
