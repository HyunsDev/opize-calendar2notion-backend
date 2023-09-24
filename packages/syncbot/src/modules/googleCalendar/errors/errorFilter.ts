import { GaxiosError } from 'googleapis-common';

import { SyncContext } from '@/contexts/sync.context';

import {
    GoogleCalendarErrorFilterRule,
    baseErrorFilterRules,
} from './errorFilterRules';

/**
 * 구글 API 요청에서 발생한 에러를 필터링합니다.
 */
export async function googleCalendarErrorFilter<T>(
    func: () => Promise<T>,
    context: SyncContext,
    args: any[],
    /**
     * 추가적으로 적용할 에러 필터 규칙입니다. 기본 규칙에 비해 높은 우선순위를 가집니다.
     */
    extraFilterRules: GoogleCalendarErrorFilterRule[] = [],
): Promise<T> {
    try {
        return await func();
    } catch (err) {
        if (err instanceof GaxiosError) {
            const filterRules: GoogleCalendarErrorFilterRule[] = [
                ...extraFilterRules,
                ...baseErrorFilterRules,
            ];

            const filterRule = filterRules.find((rule) =>
                rule.condition(err.response),
            );

            if (filterRule) {
                await filterRule.callback(err, context, args);
            }
        } else {
        }
    }
}
