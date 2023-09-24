import { GaxiosResponse } from 'gaxios';

import { SyncContext } from '@/contexts/sync.context';
import { APIError } from '@/error/APIError/APIError';

export const GoogleCalendarErrorCode = {
    INVALID_REQUEST: 'gcal_api_invalid_request',
    INVALID_CREDENTIALS: 'gcal_api_invalid_credentials',
    RATE_LIMIT: 'gcal_api_user_rate_limit_exceeded',
    USER_CALENDAR_USAGE_LIMIT: 'gcal_api_user_calendar_usage_limits_exceeded',
    FORBIDDEN: 'gcal_api_forbidden',
    NOT_FOUND: 'gcal_api_not_found',
    GONE_UPDATED_MIN_TOO_LONG_AGO: 'gcal_api_gone_updated_min_too_long_ago',
    GONE: 'gcal_api_gone',

    INTERNAL_SERVER_ERROR: 'gcal_api_internal_server_error',

    NO_RESPONSE: 'gcal_api_no_response',

    UNKNOWN_ERROR: 'gcal_api_unknown_error',
} as const;

export class GoogleCalendarAPIError extends APIError {
    constructor(data: {
        code: keyof typeof GoogleCalendarErrorCode;
        description: GoogleCalendarAPIError['description'];
        finishWork: GoogleCalendarAPIError['finishWork'];

        context?: SyncContext;
        response?: GaxiosResponse<any>;
        args: any[];

        extraDetail?: GoogleCalendarAPIError['detail'];
        level?: GoogleCalendarAPIError['level'];
        archive?: GoogleCalendarAPIError['archive'];
    }) {
        const detail = {
            args: data.args,
            response: {
                body: data.response.data,
                status: data.response.status,
            },
            request: {
                body: data.response.config.data,
                url: data.response.config.url,
                method: data.response.config.method,
                data: data.response.config.data,
                params: data.response.config.params,
            },
            extraDetail: data.extraDetail,
        };
        super({
            code: data.code,
            from: 'GOOGLE CALENDAR',
            description: data.description,
            detail: JSON.stringify(detail),
            user: data.context?.user,
            finishWork: data.finishWork,
            archive: false,
        });
    }
}
