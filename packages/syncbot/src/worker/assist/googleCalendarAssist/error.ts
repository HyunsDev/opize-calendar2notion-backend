import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { SyncError } from '../../error/error';
import { GaxiosError } from 'googleapis-common';

export enum GoogleCalendarSyncErrorCode {
    INVALID_REQUEST = 'gcal_api_invalid_request',
    INVALID_CREDENTIALS = 'gcal_api_invalid_credentials',
    USER_RATE_LIMIT = 'gcal_api_rate_limit_exceeded',
    RATE_LIMIT = 'gcal_api_user_rate_limit_exceeded',
    USER_CALENDAR_USAGE_LIMIT = 'gcal_api_user_calendar_usage_limits_exceeded',
    FORBIDDEN = 'gcal_api_forbidden',
    NOT_FOUND = 'gcal_api_not_found',
    GONE_UPDATED_MIN_TOO_LONG_AGO = 'gcal_api_gone_updated_min_too_long_ago',
    GONE = 'gcal_api_gone',
    INTERNAL_SERVER_ERROR = 'gcal_api_internal_server_error',
    UNKNOWN_ERROR = 'gcal_api_unknown_error',
}

type GoogleErrorSyncErrorConstructor = {
    code: GoogleCalendarSyncErrorCode;
    description: ErrorLogEntity['description'];
    detail?: GaxiosError;
    showUser?: ErrorLogEntity['showUser'];
    guideUrl?: ErrorLogEntity['guideUrl'];
    knownError?: ErrorLogEntity['knownError'];
    level?: ErrorLogEntity['level'];
    archive?: ErrorLogEntity['archive'];
    user: ErrorLogEntity['user'];
    finishWork?: ErrorLogEntity['finishWork'];
};

export class GoogleCalendarSyncError extends SyncError {
    constructor(props: GoogleErrorSyncErrorConstructor) {
        super({
            ...props,
            from: 'GOOGLE CALENDAR',
            detail: JSON.stringify({
                response: {
                    body: props?.detail?.response.data,
                    status: props?.detail?.response.status,
                },
                request: {
                    body: props?.detail?.response.config.body,
                    url: props?.detail?.response.config.url,
                    method: props?.detail?.response.config.method,
                    data: props?.detail?.response.config.data,
                    params: props?.detail?.response.config.params,
                },
            }),
        });
    }
}
