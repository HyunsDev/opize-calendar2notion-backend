import { IsString } from 'class-validator';

export class GoogleAccountDTO {
    @IsString()
    code: string;
}
