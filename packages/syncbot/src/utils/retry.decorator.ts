import { sleep } from './sleep';

/**
 * API 요청에 실패했을 때 {maxRetriesCount} 만큼 다시 시도합니다
 * @param maxRetriesCount
 * @param interval
 * @returns
 */
export function retry(maxRetriesCount = 3, interval = 1000) {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            let retriesCount = maxRetriesCount;
            while (true) {
                try {
                    retriesCount -= 1;
                    return method.apply(this, e);
                } catch (err) {
                    if (retriesCount === 0) throw err;
                    await sleep(interval);
                }
            }
        };
    };
}
