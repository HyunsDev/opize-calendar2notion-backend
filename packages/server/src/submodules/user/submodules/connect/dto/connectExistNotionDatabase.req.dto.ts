import { IsString } from 'class-validator';

export class ConnectExistNotionDatabaseReqDto {
    @IsString()
    public databaseId: string;
}
