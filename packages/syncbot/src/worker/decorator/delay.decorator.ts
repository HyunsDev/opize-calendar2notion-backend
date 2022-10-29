import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { sleep } from 'src/utils';
import { DB } from '../../database';
import { SyncError } from '../error/error';

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
