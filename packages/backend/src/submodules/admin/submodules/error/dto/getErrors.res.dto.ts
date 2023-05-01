import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { pick } from 'src/common/utils/pick';

type ErrorLogObject = Pick<
    ErrorLogEntity,
    | 'id'
    | 'code'
    | 'from'
    | 'description'
    | 'detail'
    | 'stack'
    | 'showUser'
    | 'guideUrl'
    | 'level'
    | 'archive'
    | 'finishWork'
    | 'userId'
    | 'createdAt'
    | 'updatedAt'
    | 'user'
>;

export class GetErrorsResDto {
    errorLogs: ErrorLogObject[];

    constructor(errorLogs: ErrorLogEntity[]) {
        this.errorLogs = errorLogs.map((errorLog) =>
            pick(errorLog, [
                'id',
                'code',
                'from',
                'description',
                'detail',
                'stack',
                'showUser',
                'guideUrl',
                'level',
                'archive',
                'finishWork',
                'userId',
                'createdAt',
                'updatedAt',
                'user',
            ]),
        );
    }
}
