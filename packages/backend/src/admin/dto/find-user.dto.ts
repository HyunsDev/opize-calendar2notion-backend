import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class FindUserDto {
    email?: string;
    googleEmail?: string;
    id?: string;
    opizeId?: string;
}
