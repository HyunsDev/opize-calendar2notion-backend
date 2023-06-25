import { IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    token: string;

    @IsString()
    redirectUrl: string;
}
