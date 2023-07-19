import { IsBoolean, IsIn, IsNumber, IsObject, IsString } from 'class-validator';
import { UserEntity } from '../entity';
import { Expose, plainToClass } from 'class-transformer';

export type UserSyncStatus =
    | 'FIRST'
    | 'GOOGLE_SET'
    | 'NOTION_API_SET'
    | 'NOTION_SET'
    | 'FINISHED';

export type UserPlan = 'FREE' | 'PRO' | 'SPONSOR';

export type NotionProps = {
    calendar: string;
    date: string;
    delete: string;
    title: string;
};

export class UserDto {
    @Expose()
    @IsNumber()
    id: number;

    @Expose()
    @IsString()
    name: string;

    @Expose()
    @IsString()
    email: string;

    @Expose()
    @IsString()
    imageUrl: string;

    @Expose()
    @IsNumber()
    opizeId: number;

    @Expose()
    @IsString()
    googleEmail: string;

    @Expose()
    @IsString()
    notionDatabaseId: string;

    @Expose()
    @IsString()
    lastCalendarSync: Date;

    @Expose()
    @IsString()
    lastSyncStatus: string;

    @Expose()
    @IsIn(['FIRST', 'GOOGLE_SET', 'NOTION_API_SET', 'NOTION_SET', 'FINISHED'])
    status: UserSyncStatus;

    @Expose()
    @IsBoolean()
    isConnected: boolean;

    @Expose()
    @IsString()
    userPlan: UserPlan;

    @Expose()
    @IsString()
    userTimeZone: string;

    @Expose()
    @IsObject()
    notionProps: NotionProps;

    @Expose()
    @IsBoolean()
    isWork: boolean;

    @Expose()
    @IsString()
    workStartedAt: Date;

    @Expose()
    @IsBoolean()
    isAdmin: boolean;

    @Expose()
    @IsString()
    isPlanUnlimited: boolean;

    @Expose()
    @IsString()
    lastPaymentTime: string;

    @Expose()
    @IsString()
    nextPaymentTime: string;

    @Expose()
    @IsNumber()
    syncYear: number;

    @Expose()
    @IsString()
    createdAt: string;

    constructor(user: UserEntity) {
        if (!user) {
            return;
        }
        Object.assign(
            this,
            plainToClass(UserDto, user, { excludeExtraneousValues: true }),
        );
        this.notionProps = JSON.parse(user.notionProps || '{}');
    }
}
