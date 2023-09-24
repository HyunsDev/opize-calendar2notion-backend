import { IsOptional, IsString } from 'class-validator';

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
