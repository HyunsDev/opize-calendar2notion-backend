import packageJson from '../../../package.json';

type ManagerStorageMap = {
    readonly prefix: string;
    readonly startedAt: Date;
    timeout: number;
    stop: boolean;
    readonly verizon: string;

    readonly workerAmount: {
        init: number;
        pro: number;
        free: number;
        sponsor: number;
    };

    work: {
        [id: string]: {
            loopId: string;
            nowWorkUserId: number | null;
            completedSyncCount: number;
        };
    };
};

const initValues: ManagerStorageMap = {
    prefix: process.env.SYNCBOT_PREFIX,
    verizon: packageJson.version,
    startedAt: new Date(),
    timeout: 1000 * 60 * 60,
    stop: false,
    workerAmount: {
        init: 2,
        pro: 2,
        free: 2,
        sponsor: 2,
    },
    work: {},
};

/**
 * Manager에서 사용되는 데이터를 보관하는 클래스입니다
 * date 속성을 통해 직접 접근하거나, getItem, setItem 메소드를 통해 접근할 수 있습니다.
 */
export class ManagerStorage {
    public data: ManagerStorageMap = initValues;

    public getItem<T extends keyof ManagerStorageMap>(key: T) {
        return this.data[key];
    }

    public setItem<
        T extends keyof ManagerStorageMap,
        U extends ManagerStorageMap[T],
    >(key: T, value: U) {
        this.data[key] = value;
    }
}

export const managerStorage = new ManagerStorage();
