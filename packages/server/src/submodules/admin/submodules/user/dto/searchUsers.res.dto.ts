import { UserEntity } from '@opize/calendar2notion-entity';

export class SearchUsersResDto {
    users: UserEntity[];
    count: number;
    page: number;
}
