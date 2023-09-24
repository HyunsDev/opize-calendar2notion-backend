export type Migration1PaymentLogEntity = {
    id: number;
    userPlan: string;
    paymentKind: string;
    price: number;
    priceKind: string;
    paymentTime: string;
    expirationTime: string;
    memo: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
};
