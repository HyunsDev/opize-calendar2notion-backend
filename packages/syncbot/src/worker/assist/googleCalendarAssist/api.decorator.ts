import { sleep } from '../../../utils';
import { GaxiosError } from 'googleapis-common';
import { DB } from '../../../database';
import { UserEntity } from '@opize/calendar2notion-model';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SyncErrorCode } from '../../error';
import { GoogleCalendarSyncError } from '../../error/googleCalendar.error';
dayjs.extend(utc);
dayjs.extend(timezone);

const handleGoogleHandlerErrors = async (
    err: GaxiosError,
    user: UserEntity,
) => {
    if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.INVALID_REQUEST,
                user,
                err,
            });
        }

        if (status === 401) {
            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.INVALID_CREDENTIALS,
                user,
                err,
            });
        }

        if (status === 403) {
            if (
                ['User Rate Limit Exceeded', 'Rate Limit Exceeded'].includes(
                    data.message,
                )
            ) {
                throw new GoogleCalendarSyncError({
                    code: SyncErrorCode.GoogleCalendar.RATE_LIMIT,
                    user,
                    err,
                });
            }

            if (
                [
                    'Calendar usage limits exceeded.',
                    'Calendar usage limits exceeded',
                ].includes(data.message)
            ) {
                throw new GoogleCalendarSyncError({
                    code: SyncErrorCode.GoogleCalendar
                        .USER_CALENDAR_USAGE_LIMIT,
                    user,
                    err,
                });
            }

            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.USER_CALENDAR_USAGE_LIMIT,
                user,
                err,
            });
        }

        if (status === 404) {
            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.NOT_FOUND,
                user,
                err,
            });
        }

        if (status === 410) {
            if (data.message === 'deleted') {
                return;
            }

            if (data.error.errors[0].reason === 'updatedMinTooLongAgo') {
                await DB.user.update(
                    {
                        id: user.id,
                    },
                    {
                        lastCalendarSync: dayjs().add(-10, 'days').toDate(),
                    },
                );

                throw new GoogleCalendarSyncError({
                    code: SyncErrorCode.GoogleCalendar
                        .GONE_UPDATED_MIN_TOO_LONG_AGO,
                    user,
                    err,
                });
            }

            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.GONE,
                user,
                err,
            });
        }

        if (status === 429) {
            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.RATE_LIMIT,
                user,
                err,
            });
        }

        if (status === 500) {
            throw new GoogleCalendarSyncError({
                code: SyncErrorCode.GoogleCalendar.INTERNAL_SERVER_ERROR,
                user,
                err,
            });
        }

        throw new GoogleCalendarSyncError({
            code: SyncErrorCode.GoogleCalendar.UNKNOWN_ERROR,
            user,
            err,
        });
    } else {
        throw new GoogleCalendarSyncError({
            code: SyncErrorCode.GoogleCalendar.UNKNOWN_ERROR,
            user,
            err,
        });
    }
};

export function gCalApi() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            try {
                // API RATE LIMIT 방지를 위한 SLEEP
                await sleep(400);
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
            } catch (err: unknown) {
                if (err instanceof GaxiosError) {
                    handleGoogleHandlerErrors(err, this.user);
                } else {
                    throw err;
                }
            }
        };
    };
}
