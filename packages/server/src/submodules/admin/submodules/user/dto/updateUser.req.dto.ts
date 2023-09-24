import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserReqDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    opizeId?: number;

    @IsOptional()
    @IsString()
    opizeAccessToken?: string;

    @IsOptional()
    @IsString()
    googleId?: string;

    @IsOptional()
    @IsString()
    googleAccessToken?: string;

    @IsOptional()
    @IsString()
    googleEmail?: string;

    @IsOptional()
    @IsString()
    googleRefreshToken?: string;

    @IsOptional()
    @IsString()
    notionAccessToken?: string;

    @IsOptional()
    @IsString()
    notionBotId?: string;

    @IsOptional()
    @IsString()
    notionDatabaseId?: string;

    @IsOptional()
    @IsString()
    lastCalendarSync?: string;

    @IsOptional()
    @IsString()
    lastSyncStatus?: string;

    @IsOptional()
    @IsIn(['FIRST', 'GOOGLE_SET', 'NOTION_API_SET', 'NOTION_SET', 'FINISHED'])
    status?:
        | 'FIRST'
        | 'GOOGLE_SET'
        | 'NOTION_API_SET'
        | 'NOTION_SET'
        | 'FINISHED';

    @IsOptional()
    @IsBoolean()
    isConnected?: boolean;

    @IsOptional()
    @IsIn(['FREE', 'PRO'])
    userPlan?: 'FREE' | 'PRO';

    @IsOptional()
    @IsString()
    userTimeZone?: string;

    @IsOptional()
    @IsString()
    notionProps: string;

    @IsOptional()
    @IsBoolean()
    isWork: boolean;
}
