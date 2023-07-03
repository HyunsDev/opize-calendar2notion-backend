import { UserEntity } from '@opize/calendar2notion-model';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { GaxiosError } from 'googleapis-common';

import { DB } from '../../../database';
import { sleep } from '../../../utils';
import { SyncErrorCode } from '../../error';
import { GoogleCalendarAPIError } from '../../error/googleCalendar.error';
dayjs.extend(utc);
dayjs.extend(timezone);

const handleGoogleHandlerErrors = async (
    err: GaxiosError,
    user: UserEntity,
) => {
    if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.INVALID_REQUEST,
                user,
                err,
            });
        }

        if (status === 401) {
            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.INVALID_CREDENTIALS,
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
                throw new GoogleCalendarAPIError({
                    code: SyncErrorCode.googleCalendar.api.RATE_LIMIT,
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
                throw new GoogleCalendarAPIError({
                    code: SyncErrorCode.googleCalendar.api
                        .USER_CALENDAR_USAGE_LIMIT,
                    user,
                    err,
                });
            }

            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api
                    .USER_CALENDAR_USAGE_LIMIT,
                user,
                err,
            });
        }

        if (status === 404) {
            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.NOT_FOUND,
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

                throw new GoogleCalendarAPIError({
                    code: SyncErrorCode.googleCalendar.api
                        .GONE_UPDATED_MIN_TOO_LONG_AGO,
                    user,
                    err,
                });
            }

            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.GONE,
                user,
                err,
            });
        }

        if (status === 429) {
            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.RATE_LIMIT,
                user,
                err,
            });
        }

        if (status === 500) {
            throw new GoogleCalendarAPIError({
                code: SyncErrorCode.googleCalendar.api.INTERNAL_SERVER_ERROR,
                user,
                err,
            });
        }

        throw new GoogleCalendarAPIError({
            code: SyncErrorCode.googleCalendar.api.UNKNOWN_ERROR,
            user,
            err,
        });
    } else {
        throw new GoogleCalendarAPIError({
            code: SyncErrorCode.googleCalendar.api.UNKNOWN_ERROR,
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
                    await handleGoogleHandlerErrors(err, this.context.user);
                } else {
                    throw err;
                }
            }
        };
    };
}
