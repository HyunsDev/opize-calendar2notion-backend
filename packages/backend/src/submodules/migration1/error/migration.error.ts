import { HttpException, HttpStatus } from '@nestjs/common';

export type Migration1ErrorCode =
    | 'NOTION_DATABASE_INVALID_PROPERTIES'
    | 'NOTION_DATABASE_INVALID_CALENDAR'
    | 'DUPLICATED_CALENDAR_NAME'
    | 'NOTION_DATABASE_NOT_FOUND'
    | 'MIGRATE_USER_NOT_FOUND';

export class Migration1Error extends HttpException {
    code: Migration1ErrorCode;
    detail: any;
    videoId?: string;

    constructor(
        code: Migration1ErrorCode,
        message: string,
        description: string,
        status: HttpStatus,
        detail?: any,
        videoId?: string,
    ) {
        super(
            {
                code,
                detail,
                message,
                description,
                videoId,
            },
            status,
        );
        this.name = 'MigrationError';
        this.code = code;
        this.detail = detail;
        this.videoId = videoId;
    }
}
