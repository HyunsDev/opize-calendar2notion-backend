import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { DB } from '../../database';
import { SyncError } from '../error/error';

export function SyncErrorBoundary(boundaryName: string) {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            try {
                return await method.apply(this, e);
            } catch (err: unknown) {
                throw err;
            }
        };
    };
}
