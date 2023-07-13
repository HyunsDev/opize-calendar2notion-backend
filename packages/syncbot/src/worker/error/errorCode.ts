const GoogleCalendarAPIErrorCode = {
    INVALID_REQUEST: 'gcal_api_invalid_request',
    INVALID_CREDENTIALS: 'gcal_api_invalid_credentials',
    RATE_LIMIT: 'gcal_api_user_rate_limit_exceeded',
    USER_CALENDAR_USAGE_LIMIT: 'gcal_api_user_calendar_usage_limits_exceeded',
    FORBIDDEN: 'gcal_api_forbidden',
    NOT_FOUND: 'gcal_api_not_found',
    GONE_UPDATED_MIN_TOO_LONG_AGO: 'gcal_api_gone_updated_min_too_long_ago',
    GONE: 'gcal_api_gone',
    INTERNAL_SERVER_ERROR: 'gcal_api_internal_server_error',
    UNKNOWN_ERROR: 'gcal_api_unknown_error',
} as const;

const NotionAPIErrorCode = {
    INVALID_REQUEST: 'notion_api_invalid_request',
    DATABASE_NOT_FOUND: 'notion_api_database_not_found',
    PAGE_NOT_FOUND: 'notion_api_page_not_found',
    RATE_LIMIT: 'notion_api_rate_limit_exceeded',
    UNAUTHORIZED: 'notion_api_unauthorized',
    CONFLICT_ERROR: 'notion_api_conflict_error',
    INTERNAL_SERVER_ERROR: 'notion_api_internal_server_error',
    SERVICE_UNAVAILABLE: 'notion_api_service_unavailable',
    UNKNOWN_ERROR: 'notion_api_unknown_error',

    DATABASE_ARCHIVED: 'notion_api_database_archived',
};

const NotionSyncErrorCode = {
    VALIDATION_ERROR: 'notion_validation_error',
};

export const SyncErrorCode = {
    googleCalendar: {
        api: GoogleCalendarAPIErrorCode,
    },
    notion: {
        api: NotionAPIErrorCode,
        sync: NotionSyncErrorCode,
    },
} as const;
