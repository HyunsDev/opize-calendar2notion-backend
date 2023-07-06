import { Injectable } from '@nestjs/common';

import { NotionClient } from '../api-client/notion.client';

@Injectable()
export class NotionValidateService {
    getClient(notionAccessToken: string) {
        return new NotionClient(notionAccessToken);
    }
}
