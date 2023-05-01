import { Client } from '@notionhq/client';

export class NotionClient {
    client: Client;

    constructor(userAccessToken: string) {
        this.client = new Client({ auth: userAccessToken });
    }

    async getPage(pageId: string) {
        return this.client.pages.retrieve({ page_id: pageId });
    }
}
