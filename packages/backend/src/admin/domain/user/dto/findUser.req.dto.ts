import { IsString } from 'class-validator';

export class FindUserReqDto {
    @IsString()
    email?: string;
    googleEmail?: string;
    id?: string;
    opizeId?: string;
}
