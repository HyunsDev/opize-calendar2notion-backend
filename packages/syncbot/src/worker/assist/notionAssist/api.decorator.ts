import { APIResponseError } from '@notionhq/client';
import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { sleep } from '../../../utils';
import { DB } from '../../../database';
import { SyncError } from '../../error/error';

export function notionApi(targetObject: 'database' | 'page') {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            try {
                await sleep(400); // API RATE LIMIT 방지를 위한 SLEEP
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
                    if (err.status === 400) {
                        throw new SyncError({
                            code: `notion_api_invalid_request`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 API 호출 요류`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: err.body,
                        });
                    }

                    if (err.status === 404) {
                        throw new SyncError({
                            code: `notion_api_${targetObject}_not_found`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 ${
                                targetObject === 'database'
                                    ? '데이터베이스'
                                    : '페이지'
                            }를 찾을 수 없습니다.`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                        });
                    }

                    if (err.status === 429) {
                        throw new SyncError({
                            code: `notion_api_rate_limit_exceeded`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 API 과도한 요청 빈도`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                        });
                    }

                    if (err.status === 401) {
                        throw new SyncError({
                            code: `notion_api_unauthorized`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 토큰이 올바르지 않습니다.`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: err.body,
                        });
                    }

                    if (err.status === 409) {
                        throw new SyncError({
                            code: `notion_api_conflict_error`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 API 트랜젝션 충돌`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: err.body,
                        });
                    }

                    if (err.status === 500) {
                        throw new SyncError({
                            code: `notion_api_internal_server_error`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 API 서버 오류 (500)`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: err.body,
                        });
                    }

                    if (err.status === 503) {
                        throw new SyncError({
                            code: `notion_api_service_unavailable`,
                            from: 'NOTION',
                            archive: false,
                            description: `노션 API 서버 오류 (503)`,
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: err.body,
                        });
                    }

                    throw err;
                } else {
                    throw err;
                }
            }
        };
    };
}
