import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-object';
import { NotionClient } from 'src/common/api-client/notion.client';
import { Repository } from 'typeorm';

@Injectable()
export class AdminNotionToolsService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    private getNotionAccessToken(user: UserEntity) {
        return user.notionWorkspace.accessToken || user.notionAccessToken;
    }

    async getNotionDatabase(user: UserEntity): Promise<any> {
        const accessToken = this.getNotionAccessToken(user);
        const databaseId = user.notionDatabaseId;
        const client = new NotionClient(accessToken);

        const database = await client.getDatabase(databaseId);
        return database;
    }
}
