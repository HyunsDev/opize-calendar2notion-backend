import { IsIn, IsNumber, IsString } from 'class-validator';
import { UserPlan } from './user.dto';
import { PaymentLogEntity } from '../entity';
import { Expose, plainToClass } from 'class-transformer';

export class PaymentLogDto {
    @Expose()
    @IsNumber()
    id: number;

    @Expose()
    @IsIn(['FREE', 'PRO', 'SPONSOR'])
    plan: UserPlan;

    @Expose()
    @IsString()
    paymentKind: string;

    @Expose()
    @IsNumber()
    price: number;

    @Expose()
    @IsString()
    priceKind: string;

    @Expose()
    @IsString()
    paymentTime: string;

    @Expose()
    @IsString()
    months: string;

    @Expose()
    @IsString()
    expirationTime: string;

    @Expose()
    @IsString()
    memo: string;

    @Expose()
    @IsNumber()
    userId: number;

    @Expose()
    @IsString()
    createdAt: string;

    constructor(paymentLog: PaymentLogEntity) {
        if (!paymentLog) return;
        Object.assign(
            this,
            plainToClass(PaymentLogDto, paymentLog, {
                excludeExtraneousValues: true,
            }),
        );
    }
}
