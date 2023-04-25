import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isConnected?: boolean;

    @IsOptional()
    @IsBoolean()
    isWork?: boolean;

    @IsOptional()
    @IsString()
    userTimeZone?: string;

    //   @IsOptional()
    //   notionProps?: {
    //     title: string;
    //     calendar: string;
    //     date: string;
    //     delete: string;
    //     link?: string;
    //     description?: string;
    //     location?: string;
    //   };
}
