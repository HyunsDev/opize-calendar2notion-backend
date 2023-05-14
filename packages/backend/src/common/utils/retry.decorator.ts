import { sleep } from './sleep';

export function retry() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            await sleep(400); // API RATE LIMIT 방지를 위한 SLEEP
            let retriesCount = 3;
            while (true) {
                try {
                    retriesCount -= 1;
                    return await method.apply(this, e);
                } catch (err) {
                    if (retriesCount === 0) throw err;
                    await sleep(1000);
                }
            }
        };
    };
}
