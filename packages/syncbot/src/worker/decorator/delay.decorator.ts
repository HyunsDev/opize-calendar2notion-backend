import { sleep } from 'src/utils';

export function delay(ms: number) {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            const res = await method.apply(this, e);
            await sleep(ms);
            return res;
        };
    };
}
