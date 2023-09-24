import { UserEntity } from '@opize/calendar2notion-object';

export class SearchUsersResDto {
    users: UserEntity[];
    count: number;
    page: number;
}
