import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-model';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class OpizeAuthService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        private readonly httpService: HttpService,
    ) {}

    async getUserToken(token: string, redirectUrl: string) {
        try {
            const res = await firstValueFrom(
                this.httpService.post(
                    `${process.env.OPIZE_API_SERVER}/oauth`,
                    {
                        generateToken: token,
                        redirectUrl: redirectUrl,
                    },
                    {
                        headers: {
                            authorization: `Bearer ${process.env.OPIZE_PROJECT_SECRET_TOKEN}`,
                        },
                    },
                ),
            );
            return res.data.token;
        } catch (err) {
            console.log(err);
            if (err?.response?.status === 400) {
                throw new BadRequestException({
                    code: 'OPIZE_OAUTH_BAD_REQUEST',
                });
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    async getUserByOpize(token: string) {
        const res = await firstValueFrom(
            this.httpService.get(`${process.env.OPIZE_API_SERVER}/oauth/user`, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            }),
        );

        return res.data as {
            id: number;
            name: string;
            email: string;
            imageUrl: string;
            status: string;
            currency: string;
        };
    }
}
