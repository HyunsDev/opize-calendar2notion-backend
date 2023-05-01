import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';

@Injectable()
export class SyncbotStreamService {
    constructor(
        @InjectRepository(SyncBotEntity)
        private syncBotsRepository: Repository<SyncBotEntity>,
    ) {}

    async checkSyncBot(prefix: string, controlSecret: string) {
        const syncbot = await this.getSyncBot(prefix);
        if (syncbot?.controlSecret !== controlSecret) {
            throw new ForbiddenException({
                code: 'wrong_controlSecret',
            });
        }
        return true;
    }

    async getSyncBot(prefix: string) {
        return await this.syncBotsRepository.findOne({
            where: {
                prefix,
            },
        });
    }
}
