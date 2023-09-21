export class ReportContext {
    initCount: number;
    syncCount: number;
    successfulSyncCount: number;
    failedSyncCount: number;
    startedAt: string;

    constructor() {
        this.initCount = 0;
        this.syncCount = 0;
        this.successfulSyncCount = 0;
        this.failedSyncCount = 0;
        this.startedAt = new Date().toISOString();
    }
}
