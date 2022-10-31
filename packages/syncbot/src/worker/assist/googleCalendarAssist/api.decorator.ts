import { sleep } from '../../../utils';
import { SyncError } from '../../error/error';
import { GaxiosError } from 'googleapis-common';

export function gCalApi() {
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
                if (err instanceof GaxiosError) {
                    if (err.response.status === 400) {
                        throw new SyncError({
                            code: 'gcal_api_invalid_request',
                            from: 'GOOGLE CALENDAR',
                            archive: true,
                            description: '구글 캘린더 API 호출 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 401) {
                        throw new SyncError({
                            code: 'gcal_api_invalid_credentials',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 인증 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 403) {
                        if (
                            err.response.data.message ===
                            'User Rate Limit Exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_user_rate_limit_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description: '구글 캘린더 과도한 유저 요청',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify(err.response.data),
                            });
                        }
                        if (
                            err.response.data.message === 'Rate Limit Exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_rate_limit_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description: '구글 캘린더 과도한 요청',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify(err.response.data),
                            });
                        }
                        if (
                            err.response.data.message ===
                                'Calendar usage limits exceeded.' ||
                            err.response.data.message ===
                                'Calendar usage limits exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_user_calendar_usage_limits_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description:
                                    '구글 캘린더 유저 캘린더 사용한도 초과',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify(err.response.data),
                            });
                        }

                        throw new SyncError({
                            code: 'gcal_api_forbidden',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 권한 없는 수정',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 404) {
                        throw new SyncError({
                            code: 'gcal_api_not_found',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description:
                                '구글 리소스(캘린더, 이벤트)를 찾을 수 없음',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 410) {
                        throw new SyncError({
                            code: 'gcal_api_gone',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description:
                                'updatedMin을 사용할 수 없음 (너무 오랬동안 동기화 되지 않음)',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 429) {
                        throw new SyncError({
                            code: 'gcal_api_rate_limit_exceeded',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 과도한 요청',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: JSON.stringify(err.response.data),
                        });
                    }

                    if (err.response.status === 500) {
                        throw new SyncError({
                            code: 'gcal_api_backend_error',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 API 서버 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: JSON.stringify(err.response.data),
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
