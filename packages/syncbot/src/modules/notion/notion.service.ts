import { SyncContext } from '@/contexts/sync.context';

import { NotionAPIService } from './notion.api.service';

export class NotionService {
    syncContext: SyncContext;
    private apiService: NotionAPIService;

    constructor(syncContext: SyncContext) {
        this.syncContext = syncContext;
        this.apiService = new NotionAPIService(syncContext);
    }
}
