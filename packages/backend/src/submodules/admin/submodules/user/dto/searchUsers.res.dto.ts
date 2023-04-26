import { UserEntity } from '@opize/calendar2notion-model';

export class SearchUsersResDto {
    users: UserEntity[];
    count: number;
    page: number;
}
