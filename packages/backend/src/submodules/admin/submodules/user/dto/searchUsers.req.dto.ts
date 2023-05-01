import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class SearchUsersReqDto {
    @IsString()
    page: string;

    @IsString()
    where: string;
}
