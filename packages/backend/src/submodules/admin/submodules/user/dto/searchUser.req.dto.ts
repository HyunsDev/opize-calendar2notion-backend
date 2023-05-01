import { IsOptional, IsString } from 'class-validator';

export class SearchUserReqDto {
    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    googleEmail?: string;

    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsString()
    opizeId?: string;
}
