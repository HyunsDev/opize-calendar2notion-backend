import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserPlanUpgradeDto {
    @IsIn(['FREE', 'PRO'])
    plan: 'FREE' | 'PRO';

    @IsString()
    months: string;

    @IsNumber()
    price: number;

    @IsString()
    priceKind: string;

    @IsString()
    paymentKind: string;

    @IsOptional()
    @IsString()
    memo?: string;
}
