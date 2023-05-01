export type ManagerStorageMap = {
    readonly prefix: string;
    readonly startedAt: Date;
    timeout: number;
    stop: boolean;
    readonly verizon: string;

    readonly workerAmount: {
        pro: number;
        free: number;
        sponsor: number;
    };

    work: {
        [id: string]: {
            loopId: string;
            nowWorkUserId: number | undefined;
            completedSyncCount: number;
        };
    };
};
