import { IsNumber, IsString } from 'class-validator';

export class GetNotionDatabaseReqDto {
    @IsString()
    userId: string;
}
