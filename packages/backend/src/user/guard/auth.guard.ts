import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { UserService } from '../user.service';
import { Role } from '../role/role';
import { UserEntity } from '@opize/calendar2notion-model';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private userService: UserService) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        return this.validateRequest(request);
    }

    private validateRequest(request: Request) {
        const JWTString = request.headers?.authorization?.split('Bearer ')[1];
        const { type, userId } = this.userService.verify(JWTString);
        request.token = {
            type: type,
            userId: userId,
        };
        return true;
    }
}

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private userService: UserService,
        private reflector: Reflector,
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const roles =
            this.reflector.get<Role[]>('roles', context.getClass()) ||
            this.reflector.get<Role[]>('roles', context.getHandler());
        return this.validateRequest(roles, request);
    }

    private async validateRequest(roles: Role[], request: Request) {
        const JWTString = request.headers?.authorization?.split('Bearer ')[1];
        const { userId, type } = this.userService.verify(JWTString);
        request.token = {
            type: type,
            userId: userId,
        };

        if (type !== 'projectUser') return false;
        const user = await this.usersRepository.findOne({
            where: {
                id: +userId,
            },
        });
        if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');
        request.user = user;
        if (roles.includes('admin') && !user.isAdmin) {
            throw new ForbiddenException('접근 권한이 없습니다');
        }
        return true;
    }
}
