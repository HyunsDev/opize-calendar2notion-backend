export class WorkerContext {
    workers: {
        loopId: string;
        nowWorkUserId?: number;
        completedSyncCount: number;
        startedAt?: string;
    }[];

    constructor() {
        this.workers = [];
    }
}
