import { HttpService } from '@nestjs/axios';
import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-model';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { LiveCheckDto } from './dto/LiveCheck.dto';

@Injectable()
export class SyncbotStreamService {
    constructor(
        @InjectRepository(SyncBotEntity)
        private syncBotsRepository: Repository<SyncBotEntity>,
        private readonly httpService: HttpService,
    ) {}

    async liveCheck(dto: LiveCheckDto) {
        return 'This action adds a new syncbot';
    }

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
