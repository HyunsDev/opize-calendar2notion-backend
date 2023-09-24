import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminToolsService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    async getUser(id: number): Promise<UserEntity> {
        return this.usersRepository.findOne({
            where: {
                id,
            },
        });
    }
}
