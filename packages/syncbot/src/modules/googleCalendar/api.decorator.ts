import { GOOGLE_CALENDAR_API } from '@/constant/googleCalendarApi.constant';
import { SyncContext } from '@/contexts/sync.context';
import { delay, retry } from '@/utils';

import { googleCalendarErrorFilter } from './errors/errorFilter';
import { GoogleCalendarErrorFilterRule } from './errors/errorFilterRules';

export function GoogleCalendarAPI(
    extraFilterRules?: GoogleCalendarErrorFilterRule[],
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const context = this.context as SyncContext;
            const res = await retry(
                async () =>
                    await googleCalendarErrorFilter(
                        originalMethod.bind(this, args),
                        context,
                        args,
                        extraFilterRules,
                    ),
                GOOGLE_CALENDAR_API.MAX_RETRY,
                GOOGLE_CALENDAR_API.RETRY_DELAY,
            );
            await delay(GOOGLE_CALENDAR_API.INTERVAL);
            return res;
        };
    };
}
