import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetErrorsReqDto {
    @IsOptional()
    @IsString()
    page = '1';

    @IsOptional()
    @IsString()
    pageSize = '50';

    @IsOptional()
    @IsString()
    userId: string;
}
