import { IsOptional, IsString } from 'class-validator';

export class GetEventReqDto {
    @IsOptional()
    @IsString()
    eventLinkId: string;

    @IsOptional()
    @IsString()
    googleCalendarEventId: string;

    @IsOptional()
    @IsString()
    notionPageId: string;
}
