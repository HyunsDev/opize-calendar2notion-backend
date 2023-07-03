import { APIResponseError } from '@notionhq/client';
import { UserEntity } from '@opize/calendar2notion-model';

import { sleep } from '../../../utils';
import { SyncErrorCode } from '../../error';
import { NotionAPIError } from '../../error/notion.error';

const handleNotionHandlerErrors = async (
    err: APIResponseError,
    user: UserEntity,
    target: 'database' | 'page',
) => {
    const { status } = err;

    if (status === 400) {
        throw new NotionAPIError({
            code: SyncErrorCode.notion.api.INVALID_REQUEST,
            user,
            err,
        });
    }

    if (status === 401) {
        throw new NotionAPIError({
            code: SyncErrorCode.notion.api.UNAUTHORIZED,
            user,
            err,
        });
    }

    if (status === 404) {
        throw new NotionAPIError({
            code:
                target === 'database'
                    ? SyncErrorCode.notion.api.DATABASE_NOT_FOUND
                    : SyncErrorCode.notion.api.PAGE_NOT_FOUND,
            user,
            err,
        });
    }

    if (status === 429) {
        throw new NotionAPIError({
            code: SyncErrorCode.notion.api.RATE_LIMIT,
            user,
            err,
        });
    }

    if (status === 500) {
        throw new NotionAPIError({
            code: SyncErrorCode.notion.api.INTERNAL_SERVER_ERROR,
            user,
            err,
        });
    }

    if (status === 503) {
        throw new NotionAPIError({
            code: SyncErrorCode.notion.api.SERVICE_UNAVAILABLE,
            user,
            err,
        });
    }

    throw new NotionAPIError({
        code: SyncErrorCode.notion.api.UNKNOWN_ERROR,
        user,
        err,
    });
};

export function notionApi(targetObject: 'database' | 'page') {
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
                if (err instanceof APIResponseError) {
                    await handleNotionHandlerErrors(
                        err,
                        this.context.user,
                        targetObject,
                    );
                } else {
                    throw err;
                }
            }
        };
    };
}
