import { Client } from '@notionhq/client';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

import { retry } from '../utils/retry.decorator';

export class NotionClient {
    client: Client;

    constructor(userAccessToken: string) {
        this.client = new Client({ auth: userAccessToken });
    }

    @retry()
    async getPage(pageId: string) {
        return this.client.pages.retrieve({ page_id: pageId });
    }

    @retry()
    async getDatabase(pageId: string): Promise<GetDatabaseResponse | null> {
        try {
            return await this.client.databases.retrieve({
                database_id: pageId,
            });
        } catch (err) {
            if (err.code === 'object_not_found') {
                return null;
            } else {
                throw err;
            }
        }
    }

    @retry()
    async addProperty(
        databaseId: string,
        name: string,
        type: 'title' | 'rich_text' | 'number' | 'select' | 'multi_select',
    ) {
        return await this.client.databases.update({
            database_id: databaseId,
            properties: {
                [name]: {
                    name,
                    type,
                    [type]: {},
                },
            },
        });
    }
}
