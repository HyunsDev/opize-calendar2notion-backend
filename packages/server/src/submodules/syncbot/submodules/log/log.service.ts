import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-entity';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class SyncbotLogService {
    constructor(
        @InjectRepository(SyncBotEntity)
        private readonly syncBotRepository: Repository<SyncBotEntity>,
        private readonly httpService: HttpService,
    ) {}

    async getLogs(prefix: string, date: string | 'today') {
        const syncBot = await this.syncBotRepository.findOne({
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
            const res = await firstValueFrom(
                this.httpService.get(`${syncBot.url}/status/logs/${date}`, {
                    headers: {
                        authorization: `Bearer ${syncBot.controlSecret}`,
                    },
                }),
            );
            return res.data;
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                console.log(err.response);
                if (err.response.status === 404) {
                }
            } else {
                throw new BadRequestException({
                    code: 'syncBot_api_error',
                    message: `${prefix} 동기화봇에 연결할 수 없습니다.(${err?.response?.status})`,
                });
            }
        }
    }

    async getStaticLog(prefix: string, fileName: string) {
        const syncBot = await this.syncBotRepository.findOne({
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
            const res = await firstValueFrom(
                this.httpService.get(
                    `${syncBot.url}/status/logs-static/${fileName}`,
                    {
                        headers: {
                            authorization: `Bearer ${syncBot.controlSecret}`,
                        },
                    },
                ),
            );
            return {
                data: res.data,
            };
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                console.log(err.response);
                if (err.response.status === 404) {
                    throw new BadRequestException({
                        code: 'file_not_found',
                        message: '파일을 찾을 수 없습니다.',
                    });
                }
            } else {
                throw new BadRequestException({
                    code: 'syncBot_api_error',
                    message: `${prefix} 동기화봇에 연결할 수 없습니다.(${err?.response?.status})`,
                });
            }
        }
    }

    async getList(prefix: string) {
        const syncBot = await this.syncBotRepository.findOne({
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
            const res = await firstValueFrom(
                this.httpService.get(`${syncBot.url}/status/logs`, {
                    headers: {
                        authorization: `Bearer ${syncBot.controlSecret}`,
                    },
                }),
            );
            return res.data;
        } catch (err) {
            if (err instanceof AxiosError && err.response) {
                if (err.response.status === 404) {
                }
            } else {
                throw new BadRequestException({
                    code: 'syncBot_api_error',
                    message: `${prefix} 동기화봇에 연결할 수 없습니다.(${err?.response?.status})`,
                });
            }
        }
    }
}
