import { IsString, IsUrl } from 'class-validator';

export class AddSyncBotDto {
    @IsString()
    name: string;

    @IsString()
    url: string;

    @IsString()
    prefix: string;

    @IsString()
    controlSecret: string;
}
