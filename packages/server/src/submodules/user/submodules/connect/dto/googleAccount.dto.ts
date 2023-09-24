import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GoogleAccountDTO {
    @IsString()
    code: string;

    @IsOptional()
    @IsNumber()
    callbackVersion?: number;
}
