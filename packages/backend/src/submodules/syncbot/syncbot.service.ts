import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-object';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

import { AddSyncBotDto } from './dto/add-syncbot.dto';
import { ManagerStorageMap } from './types/storageMap';

@Injectable()
export class SyncbotService {
    constructor(
        @InjectRepository(SyncBotEntity)
        private syncBotsRepository: Repository<SyncBotEntity>,
        private readonly httpService: HttpService,
    ) {}

    async get() {
        const syncBots = await this.syncBotsRepository.find();
        const promises = syncBots.map((e) => {
            return (async () => {
                try {
                    const res = await firstValueFrom(
                        this.httpService.get(`${e.url}/status`, {
                            headers: {
                                authorization: `Bearer ${e.controlSecret}`,
                            },
                        }),
                    );

                    return {
                        id: e.id,
                        prefix: e.prefix,
                        name: e.name,
                        url: e.url,
                        createdAt: e.createdAt,
                        status: 'good',
                        data: res.data as ManagerStorageMap,
                    };
                } catch (err: any) {
                    return {
                        id: e.id,
                        prefix: e.prefix,
                        name: e.name,
                        url: e.url,
                        createdAt: e.createdAt,
                        status: 'error',
                    };
                }
            })();
        });

        const res = await Promise.all(promises);
        return res;
    }

    async post(dto: AddSyncBotDto) {
        try {
            const res = await firstValueFrom(
                this.httpService.get(`${dto.url}/status`, {
                    headers: {
                        authorization: `Bearer ${dto.controlSecret}`,
                    },
                }),
            );
            if (res?.data?.prefix !== dto.prefix) {
                throw new BadRequestException({
                    code: 'wrong_prefix',
                    message: `prefix가 일치하지 않습니다. (동기화봇: ${res.data.prefix})`,
                });
            }
        } catch (err: any) {
            if (err instanceof BadRequestException) {
                throw err;
            }

            if (err?.response) {
                if (err?.response?.status === 403) {
                    throw new BadRequestException({
                        code: 'bad_request',
                        message: `controlSecret가 올바르지 않습니다.`,
                    });
                }

                throw new BadRequestException({
                    code: 'bad_request',
                    message: `동기화봇 검증에 실패했습니다 - ${err?.response?.status}`,
                });
            } else {
                throw new BadRequestException({
                    code: 'bad_request',
                    message: `동기화봇에 연결할 수 없습니다.`,
                });
            }
        }

        try {
            const syncBot = SyncBotEntity.create({
                controlSecret: dto.controlSecret,
                name: dto.name,
                prefix: dto.prefix,
                url: dto.url,
            });
            await this.syncBotsRepository.save(syncBot);
            return;
        } catch (err: any) {
            if (err.name === 'QueryFailedError') {
                throw new BadRequestException({
                    code: 'duplicate_prefix',
                    message: '중복된 prefix 입니다.',
                });
            }
            throw new InternalServerErrorException({
                code: 'server_error',
                message: '서버 에러',
            });
        }
    }

    async delete(prefix: string) {
        await this.syncBotsRepository.delete({
            prefix: prefix,
        });
        return;
    }

    async stopSyncbot(prefix: string) {
        const syncBot = await this.syncBotsRepository.findOne({
            where: {
                prefix,
            },
        });

        if (!prefix) {
            throw new NotFoundException({
                code: 'syncBot_not_found',
                message: `${prefix} 동기화봇을 찾을 수 없습니다.`,
            });
        }

        try {
            await firstValueFrom(
                this.httpService.post(
                    `${syncBot.url}/control/stop`,
                    {},
                    {
                        headers: {
                            authorization: `Bearer ${syncBot.controlSecret}`,
                        },
                    },
                ),
            );
            return;
        } catch (err) {
            console.error(err.response);
            throw new BadRequestException({
                code: 'syncBot_api_error',
                message: `${prefix} 동기화봇을 찾을 수 없습니다. (${err?.response?.status})`,
            });
        }
    }

    async exitSyncbot(prefix: string) {
        const syncBot = await this.syncBotsRepository.findOne({
            where: {
                prefix,
            },
        });

        if (!prefix) {
            throw new NotFoundException({
                code: 'syncBot_not_found',
                message: `${prefix} 동기화봇을 찾을 수 없습니다.`,
            });
        }

        try {
            await firstValueFrom(
                this.httpService.post(
                    `${syncBot.url}/control/exit`,
                    {},
                    {
                        headers: {
                            authorization: `Bearer ${syncBot.controlSecret}`,
                        },
                    },
                ),
            );
            return;
        } catch (err) {
            console.error(err);
            throw new BadRequestException({
                code: 'syncBot_api_error',
                message: `${prefix} 동기화봇을 찾을 수 없습니다. (${err?.response?.status})`,
            });
        }
    }
}
