import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
