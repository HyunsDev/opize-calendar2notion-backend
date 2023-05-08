import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    getUserJWT(userId: number) {
        const JWTToken = jwt.sign(
            {
                id: userId,
                type: 'projectUser',
            },
            process.env.JWT_SECRET as string,
            {
                issuer: 'calendar2notion.opize.me',
                subject: 'user',
            },
        );
        return JWTToken;
    }

    verify(JWTString: string) {
        try {
            const payload = jwt.verify(JWTString, process.env.JWT_SECRET) as (
                | jwt.JwtPayload
                | string
            ) & {
                id: string;
                type: string;
            };
            const { id, type } = payload;
            return {
                userId: id,
                type: type,
            };
        } catch (e) {
            throw new UnauthorizedException({
                code: 'wrong_token',
            });
        }
    }
}
