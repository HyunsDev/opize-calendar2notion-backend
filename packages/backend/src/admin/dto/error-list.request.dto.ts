import { IsNumber } from 'class-validator';

export class ErrorListRequestDto {
    page: string;
    pageSize: string;
    userId?: string;
}
